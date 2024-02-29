import {
    Space,
    SpaceFactory
} from "../../imports.js";


const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");

export class AuthenticationService{

    constructor() {
    }
    async initUser(spaceId) {

        /* check if there is a cached user */
        const result = this.getCachedCurrentUser();

        if(result) {
            let user = JSON.parse(result);
            /* load the user's config file */
            let currentUser = JSON.parse(await storageManager.loadUser(user.id));
            webSkel.currentUser = {
                id:currentUser.id,
                secretToken: currentUser.secretToken,
                spaces: currentUser.spaces,
            }
            if(spaceId && currentUser.spaces){
                if(currentUser.spaces.map((space)=>{return space.id}).includes(spaceId)){
                    if(currentUser.currentSpaceId!==spaceId){
                     currentUser.currentSpaceId=spaceId;
                     await this.updateUser(user.id,currentUser);
                    }
                }
            }
           if(!currentUser.spaces){
                let defaultSpace=await this.createDefaultSpace(currentUser.id);
                await this.addSpaceToUser(currentUser.id,defaultSpace);
               currentUser.spaces=webSkel.currentUser.spaces=[{name: defaultSpace.name, id: defaultSpace.id}];
               currentUser.currentSpaceId=webSkel.currentUser.currentSpaceId=defaultSpace.id;
           }
           let spaceData;
           try {
               /* Attempting to load the last space the user was logged on */
               //let spaceData = await storageManager.loadSpace(currentUser.currentSpaceId);
               webSkel.currentUser.space = await SpaceFactory.loadSpace(currentUser.currentSpaceId)
               await webSkel.currentUser.space.loadApplicationsFlows();
           }catch (e){
               await showApplicationError(e,e,e);
               try{
                   /* To be replaced with better logic */
                   // Handle the case when the space with the currentSpaceId has been deleted manually from the disk for development
                   await this.removeSpaceFromUser(currentUser.id,currentUser.currentSpaceId);
                   console.warn("Space with id "+currentUser.currentSpaceId+" not found");
                   /*Attempting to load the Default Space if the currentSpaceId is not valid or the space with that id has been deleted */
                     //spaceData = await storageManager.loadSpace(currentUser.id);
                     webSkel.currentUser.space = await SpaceFactory.loadSpace(currentUser.currentSpaceId)
               }catch(e){
                   console.warn("Couldn't load the default space for user "+currentUser.id+"");
                   /* Attempting to load any space from the User's spaces array and removing the invalid ones */
                   await this.resetUser(currentUser.id);
                   window.location="";
               }
           }
        }
        else {
            if(window.location.hash !== "#authentication-page")
            {
                window.location.replace("#authentication-page");
            }
            webSkel.setDomElementForPages(mainContent);
            await webSkel.changeToDynamicPage("authentication-page","authentication-page");
            return false;
        }
        return true;
    }
    async resetUser(userId){
        let user = JSON.parse(await storageManager.loadUser(userId));
        delete user.spaces;
        delete user.currentSpaceId;
        await storageManager.storeUser(userId,JSON.stringify(user));
    }
    verifyPassword(secretToken, password) {
        //secretToken should be an object with type Buffer or an Uint8Array
        if(secretToken.type === 'Buffer') {
            const uint8Array = new Uint8Array(secretToken.data.length);
            for (let i = 0; i < secretToken.data.length; i++) {
                uint8Array[i] = secretToken.data[i];
            }
            return crypto.decrypt(uint8Array, crypto.deriveEncryptionKey(password));
        }
        return crypto.decrypt(secretToken, crypto.deriveEncryptionKey(password));
    }

    getCachedUsers(){
        return localStorage.getItem("users");
    }
    addCachedUser(user){
        let usersString = this.getCachedUsers();
        let users = [];
        if(usersString) {
            users = JSON.parse(usersString);
        }
        users.push(user);
        localStorage.setItem("users", JSON.stringify(users));
    }
    deleteCachedUser(id){
        let usersString = this.getCachedUsers();
        try{
            let users = JSON.parse(usersString);
            users = users.filter(user => user.id !== id);
            localStorage.setItem("users", JSON.stringify(users));
        }catch (e){
            console.log(e);
        }
    }

    setCachedCurrentUser(userObj){
        localStorage.setItem("currentUser", JSON.stringify(userObj));
    }
    deleteCachedCurrentUser(){
        localStorage.removeItem("currentUser");
    }
    getCachedCurrentUser(){
        //returns string
        return localStorage.getItem("currentUser");
    }
    async createDefaultSpace(currentUserId){
        return await SpaceFactory.createSpace( "Personal Space",undefined,currentUserId);
    }
    async removeSpaceFromUser(userId,spaceId){
           let user = JSON.parse(await storageManager.loadUser(userId));
           user.spaces = user.spaces.filter(space => space.id !== spaceId);
           await storageManager.storeUser(userId,JSON.stringify(user));
    }
    async updateUser(userId,userData){
        let user = JSON.parse(await storageManager.loadUser(userId));
        await storageManager.storeUser(userId,JSON.stringify(userData));
    }
    async removeSpaceFromUsers(spaceId) {
        let promises = [];
        /* we assume the current User has delete rights for now*/
        for (let userId of webSkel.currentUser.space.users) {
            promises.push(this.removeSpaceFromUser(userId, spaceId));
        }
        await Promise.all(promises);
    }
    async registerUser(userData) {
        const randomNr = crypto.generateRandom(32);
        const secretToken = crypto.encrypt(randomNr,crypto.deriveEncryptionKey(userData.password));
        delete userData.password;

        userData.secretToken = secretToken;
        userData.id = webSkel.appServices.generateId();

        let defaultSpace = this.createDefaultSpace(userData.id);
        userData.spaces = [{name: defaultSpace.name, id: defaultSpace.id}];
        userData.currentSpaceId = defaultSpace.id;
        //const didDocument = await $$.promisify(w3cDID.createIdentity)("key", undefined, randomNr);
        try{
            let result = await storageManager.storeUser(userData.id, JSON.stringify(userData));
            webSkel.currentUser = JSON.parse(result);
            return true;
        }catch (e){
            console.error(e);
            return false;
        }
    }

    verifyConfirmationLink(){
        let user = {id:webSkel.currentUser.id, secretToken:webSkel.currentUser.secretToken};
        this.addCachedUser(user);
        this.setCachedCurrentUser(user);
    }

    async loginUser(email, password){
        const userString = await this.getStoredUserByEmail(email);
        try{
            let userObj = JSON.parse(userString);
            const userId = userObj.id;

            let users = this.getCachedUsers();
            if(users) {
                users = JSON.parse(users);
                for(let user of users){
                    if(user.id === userId) {
                        let secretToken = user.secretToken;
                        if(this.verifyPassword(secretToken, password)) {
                            this.setCachedCurrentUser({ id: userId, secretToken: secretToken});
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            }
            return false;
        }catch (e) {
            console.log(e);
            return false;
        }
    }
    async loginFirstTimeUser(email, password){
        const userString = await this.getStoredUserByEmail(email);
        try{
            let userObj = JSON.parse(userString);
            const userId = userObj.id;
            console.log(`First time logging in on this device userId: ${JSON.stringify(userId)}`);
            const result = await this.getStoredUser(userId);
            const storedUser = JSON.parse(result);
            if(this.verifyPassword(storedUser.secretToken, password)) {
                if(storedUser.spaces&&storedUser.spaces.length>0) {
                    webSkel.currentUser = {
                        id: storedUser.id,
                        secretToken: storedUser.secretToken,
                        spaces: storedUser.spaces,
                        currentSpaceId: storedUser.spaces[0].id
                    }
                }else{
                    let defaultSpace=await this.createDefaultSpace(storedUser.id);
                    webSkel.currentUser = {
                        id: storedUser.id,
                        secretToken: storedUser.secretToken,
                        spaces: [{name: defaultSpace.name, id: defaultSpace.id}],
                        currentSpaceId: defaultSpace.id
                    }
                    await this.addSpaceToUser(userId,defaultSpace);
                }
                return true;
            }else {
                return false;
            }
        }catch (e) {
            console.log(e);
            return false;
        }

    }

    async recoverPassword(email, password){
        const userString = await this.getStoredUserByEmail(email);
        try {
            let userObj = JSON.parse(userString);
            const randomNr = crypto.generateRandom(32);
            userObj.temporarySecretToken = crypto.encrypt(randomNr, crypto.deriveEncryptionKey(password));
            let result = await this.updateStoredUser(userObj);
            try {
                result = JSON.parse(result);
                webSkel.currentUser = result;
                console.log(result);

                return true;
            }catch (e){
                console.error(e);
                return false;
            }
        }catch (e){
            console.error(e);
            return false;
        }
    }

    async confirmRecoverPassword(){
        const user = JSON.parse(await this.getStoredUser(webSkel.currentUser.id));
        user.secretToken = user.temporarySecretToken;
        delete user.temporarySecretToken;
        let result = await this.updateStoredUser(user);
        try {
            result = JSON.parse(result);
            console.log(result);

            delete result.spaces;
            delete result.currentSpaceId;
            this.setCachedCurrentUser(result);
            this.deleteCachedUser(result.id);
            this.addCachedUser(result);
            return true;
        }catch (e){
            console.error(e);
            return false;
        }
    }

    async addSpaceToUser(userId,newSpace){
        let user = JSON.parse(await storageManager.loadUser(userId));
        if(user.spaces) {
            user.spaces.push({name: newSpace.name, id: newSpace.id});
        }else{
            user.spaces=[{name: newSpace.name, id: newSpace.id}];
        }
        user.currentSpaceId = newSpace.id;
        await storageManager.storeUser(userId,JSON.stringify(user));
    }
    async getStoredUser(userId){
        return await storageManager.loadUser(userId);
    }

    async getStoredUserByEmail(email){
        return await storageManager.loadUserByEmail(email);
    }

    async updateStoredUser(updatedUser){
        return await storageManager.storeUser(updatedUser.id, JSON.stringify(updatedUser));
    }

    async storeGITCredentials(stringData){
        return await storageManager.storeGITCredentials(webSkel.currentUser.space.id, webSkel.currentUser.id, stringData);
    }
    async getUsersSecretsExist(){
        return await storageManager.getUsersSecretsExist(webSkel.currentUser.space.id);
    }
}