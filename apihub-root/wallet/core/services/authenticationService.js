import {
    Space,
    SpaceFactory
} from "../../imports.js";


const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");
const w3cDID = openDSU.loadAPI("w3cdid");

export class AuthenticationService{

    constructor() {
    }
    async initUser() {
        const result = this.getCachedCurrentUser();
        if(result) {
            let user = JSON.parse(result);
            let currentUser = JSON.parse(await storageManager.loadUser(user.id));
            webSkel.currentUser = {
                id:currentUser.id,
                secretToken: currentUser.secretToken,
                spaces: currentUser.spaces,
            }
           if(!currentUser.spaces){
                let defaultSpace=await this.createDefaultSpace();
                await this.addSpaceToUser(currentUser.id,defaultSpace);
               currentUser.spaces=webSkel.currentUser.spaces=[{name: defaultSpace.name, id: defaultSpace.id}];
               currentUser.currentSpaceId=webSkel.currentUser.currentSpaceId=defaultSpace.id;
           }
           let spaceData;
           try {
               let spaceData = await storageManager.loadSpace(currentUser.currentSpaceId || currentUser.spaces[0].id);
               webSkel.currentUser.space = new Space(JSON.parse(spaceData));
           }catch (e){
               await this.resetUser(currentUser.id);
               window.location="";
           }
        }
        else {
            if(window.location !== "#authentication-page")
            {
                window.location.replace("#authentication-page");
            }
            webSkel.setDomElementForPages(mainContent);
            //await webSkel.changeToDynamicPage("authentication-page", "authentication-page");
        }
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
    async createDefaultSpace(){
        return await SpaceFactory.createSpace({name: "Personal Space"});
    }
    async registerUser(userData) {
        const randomNr = crypto.generateRandom(32);
        const secretToken = crypto.encrypt(randomNr,crypto.deriveEncryptionKey(userData.password));
        delete userData.password;

        userData.secretToken = secretToken;
        userData.id = webSkel.getService("UtilsService").generateId();

        let defaultSpace = this.createDefaultSpace();
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
                    let defaultSpace=await this.createDefaultSpace();
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
}