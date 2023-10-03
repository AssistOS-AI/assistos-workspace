const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");
const w3cDID = openDSU.loadAPI("w3cdid");

export class AuthenticationService{

    constructor() {
    }
    async initUser() {
        window.currentUser = { id: "", isPremium: false };

        const result = this.getCachedCurrentUser();

        if(result) {
            let user = JSON.parse(result);
            window.currentSpaceId = user.currentSpaceId;
            if(JSON.parse(result).secretToken !== "") {
                currentUser.isPremium = true;

            }
            currentUser.id = user.id;
        }
        else {
            /* TBD */
            const user = { id: crypto.getRandomSecret(32), secretToken: "", currentSpaceId: 1 };
            currentUser.id = user.id;
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

    async registerUser(userData) {
        const randomNr = crypto.generateRandom(32);
        const secretToken = crypto.encrypt(randomNr,crypto.deriveEncryptionKey(userData.password));
        delete userData.password;

        userData.secretToken = secretToken;
        userData.id = crypto.getRandomSecret(32).toString().split(",").join("");

        let response = await storageManager.storeUser(userData.id, JSON.stringify(userData));
        //const didDocument = await $$.promisify(w3cDID.createIdentity)("key", undefined, randomNr);
        try{
            webSkel.getService("AuthenticationService").addCachedUser(JSON.parse(response));
            return true;
        }catch (e){
            console.error(e);
            return false;
        }
    }

    async loginUser(email, password){
        const userString = await this.getStoredUserByEmail(email);
        try{
            let userObj = JSON.parse(userString);
            const userId = userObj.id;

            let users = this.getCachedUsers();
            if(users) {
                for(let user of users){
                    if(user.id === userId) {
                        let secretToken = user.secretToken;
                        if(this.verifyPassword(secretToken, password)) {
                            this.setCachedCurrentUser({ id: userId, secretToken: secretToken });
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
            if(this.verifyPassword((JSON.parse(result)).secretToken, password)) {
                let user = { id: userId, secretToken: result.secretToken};

                this.addCachedUser(user);
                this.setCachedCurrentUser(user);
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
            const result = await this.updateStoredUser(userObj);
            try {
                console.log(JSON.parse(result));
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

    async confirmRecoverPassword(userId){
        const user = await webSkel.getService("AuthenticationService").getStoredUser(userId);
        user.secretToken = user.temporarySecretToken;
        delete user.temporarySecretToken;
        const result = await webSkel.getService("AuthenticationService").updateStoredUser(user);
        try {
            console.log(JSON.parse(result));
            return true;
        }catch (e){
            console.error(e);
            return false;
        }
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