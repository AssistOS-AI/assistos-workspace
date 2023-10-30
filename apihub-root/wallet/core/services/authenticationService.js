import {SpaceFactory} from "../factories/spaceFactory.js";
import {Space} from "../../imports.js";

const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");
const w3cDID = openDSU.loadAPI("w3cdid");

export class AuthenticationService{

    constructor() {
    }
    async initUser() {
        window.currentUser = { id: "" };

        const result = this.getCachedCurrentUser();

        if(result) {
            let user = JSON.parse(result);
            window.currentSpaceId = user.currentSpaceId;

            currentUser.id = user.id;
            let spaceData = await storageManager.loadSpace(currentSpaceId);
            webSkel.space = new Space(JSON.parse(spaceData));
        }
        else {
            if(window.location !== "#authentication-page")
            {
                window.location.replace("#authentication-page");
            }
            webSkel.setDomElementForPages(mainContent);
            await webSkel.changeToDynamicPage("authentication-page", "authentication-page");
            return;
        }

        currentUser.spaces = (JSON.parse(await storageManager.loadUser(currentUser.id))).spaces;
        let userObj = JSON.parse(this.getCachedCurrentUser());
        userObj.spaces = currentUser.spaces;
        this.setCachedCurrentUser(userObj);
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

    async registerUser(userData) {
        const randomNr = crypto.generateRandom(32);
        const secretToken = crypto.encrypt(randomNr,crypto.deriveEncryptionKey(userData.password));
        delete userData.password;

        userData.secretToken = secretToken;
        userData.id = webSkel.getService("UtilsService").generateId();
        let defaultSpace = await SpaceFactory.createSpace({name: "Personal Space"});
        userData.spaces = [{name: defaultSpace.name, id: defaultSpace.id}];

        let response = await storageManager.storeUser(userData.id, JSON.stringify(userData));
        //const didDocument = await $$.promisify(w3cDID.createIdentity)("key", undefined, randomNr);
        try{
            response = JSON.parse(response);
            response.currentSpaceId = defaultSpace.id;
            this.currentUser = response;

            return true;
        }catch (e){
            console.error(e);
            return false;
        }
    }

    verifyConfirmationLink(){
        this.addCachedUser(this.currentUser);
        this.setCachedCurrentUser(this.currentUser);
        delete this.currentUser;
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
                            this.setCachedCurrentUser({ id: userId, secretToken: secretToken, currentSpaceId: user.currentSpaceId });
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
                this.currentUser = {
                    id: storedUser.id,
                    secretToken: storedUser.secretToken,
                    spaces: storedUser.spaces,
                    currentSpaceId: storedUser.spaces[0].id
                };
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
            currentUser.id = userObj.id;
            const randomNr = crypto.generateRandom(32);
            userObj.temporarySecretToken = crypto.encrypt(randomNr, crypto.deriveEncryptionKey(password));
            let result = await this.updateStoredUser(userObj);
            try {
                result = JSON.parse(result);
                result.currentSpaceId = result.spaces[0].id;

                this.currentUser = result;
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
        const user = JSON.parse(await this.getStoredUser(this.currentUser.id));
        user.secretToken = user.temporarySecretToken;
        delete user.temporarySecretToken;
        let result = await this.updateStoredUser(user);
        try {
            result = JSON.parse(result);
            result.currentSpaceId = this.currentUser.currentSpaceId;
            delete this.currentUser;
            console.log(result);
            this.setCachedCurrentUser(result);
            this.deleteCachedUser(result.id);
            this.addCachedUser(result);
            return true;
        }catch (e){
            console.error(e);
            return false;
        }
    }

    async addSpaceToUser(newSpace){
        let currentUser = JSON.parse(this.getCachedCurrentUser());
        let user = JSON.parse(await storageManager.loadUser(currentUser.id));
        user.spaces.push({name:newSpace.name, id:newSpace.id});
        await storageManager.storeUser(currentUser.id,JSON.stringify(user));
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