import { extractFormInformation } from "../../../WebSkel/utils/form-utils.js";
import {User} from "../../imports.js";

const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");
const w3cDID = openDSU.loadAPI("w3cdid");

export class AuthenticationService{

    constructor() {
    }
    async initUser() {
        window.currentUser = { userId: "", isPremium: false };

        const result = this.getCachedCurrentUser();

        if(result) {
            let user = JSON.parse(result);
            window.currentSpaceId = user.currentSpaceId;
            if(JSON.parse(result).secretToken !== "") {
                currentUser.isPremium = true;

            }
            currentUser.userId = user.userId;
        }
        else {
            /* TBD */
            const user = { userId: crypto.getRandomSecret(32), secretToken: "", currentSpaceId: 1 };
            currentUser.id = user.userId;
            this.setCachedCurrentUser(user);
            console.log("Instantiated currentUser" + JSON.stringify(user));
        }
        let spaces = await storageManager.loadObject("1","status","status");
        spaces =  JSON.parse(spaces);
        /* for multiple spaces*/
        // let spacesArray = [];
        // Object.keys(spaces).forEach(function(key, index) {
        //     spacesArray.push({name:spaces[key].name,id:spaces[key].id});
        // });
        // currentUser.spaces = spacesArray;
        currentUser.spaces = [{name:spaces.name, id:spaces.id}];
        let userObj = JSON.parse(this.getCachedCurrentUser());
        userObj.spaces = currentUser.spaces;
        this.setCachedCurrentUser(userObj)
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
        return JSON.parse(localStorage.getItem("users"));
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

    setCachedCurrentUser(userObj){
        localStorage.setItem("currentUser", JSON.stringify(userObj));
    }

    getCachedCurrentUser(){
        //returns string
        return localStorage.getItem("currentUser");
    }

    async createUser(userData) {
        const randomNr = crypto.generateRandom(32);
        const secretToken = crypto.encrypt(randomNr,crypto.deriveEncryptionKey(userData.password));
        delete userData.password;

        userData.secretToken = secretToken;
        userData.id = crypto.getRandomSecret(32).toString().split(",").join("");

        let result = await storageManager.storeUser(userData.userId, JSON.stringify(userData));
        return result.text();

    }

    async getStoredUser(userId){
        let result = await storageManager.loadUser(userId);
        return result.text();
    }

    async getStoredUserByEmail(email){
        //call storage service
    }

    async updateStoredUser(updatedUser){
        let result = await storageManager.storeUser(updatedUser.userId, JSON.stringify(updatedUser));
        return result.text();
    }
}