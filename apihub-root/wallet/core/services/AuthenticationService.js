const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");

export class AuthenticationService {

    constructor() {
    }

    async initUser(spaceId) {
        const cachedUser = this.getCachedUser();
        if (cachedUser) {

            let userData = await system.storage.loadUser(cachedUser);

            if (userData.spaces.length === 0) {
                await this.createPersonalSpace(userData.name);
                window.location = "";
            }
            system.user = {
                id: userData.id,
                secretToken: userData.secretToken,
                spaces: userData.spaces,
            }

            if (spaceId) {
                if (system.user.spaces.find(space => space.id === spaceId)) {
                    system.space = await  system.services.loadSpace(spaceId);
                } else {
                    /* TODO Custom 403 page : user does not have access to this space */
                    window.location = "";
                }
            } else {
                const cachedSpace = this.getCachedSpace();
                if (cachedSpace) {
                    system.space = await system.services.loadSpace(cachedSpace);
                } else {
                    system.space = await system.services.loadSpace(system.user.spaces[0].id);
                }
            }
        } else {
            if (window.location.hash !== "#authentication-page") {
                window.location.replace("#authentication-page");
            }
            system.UI.setDomElementForPages(mainContent);
            await system.UI.changeToDynamicPage("authentication-page", "authentication-page");
            return false;
        }
        return true;
    }

    verifyPassword(secretToken, password) {
        //secretToken should be an object with type Buffer or an Uint8Array
        if (secretToken.type === 'Buffer') {
            const uint8Array = new Uint8Array(secretToken.data.length);
            for (let i = 0; i < secretToken.data.length; i++) {
                uint8Array[i] = secretToken.data[i];
            }
            return crypto.decrypt(uint8Array, crypto.deriveEncryptionKey(password));
        }
        return crypto.decrypt(secretToken, crypto.deriveEncryptionKey(password));
    }

    getCachedUsers() {
        return localStorage.getItem("users");
    }

    addCachedUser(user) {
        let usersString = this.getCachedUsers();
        let users = [];
        if (usersString) {
            users = JSON.parse(usersString);
        }
        users.push(user);
        localStorage.setItem("users", JSON.stringify(users));
    }

    deleteCachedUser(id) {
        let usersString = this.getCachedUsers();
        try {
            let users = JSON.parse(usersString);
            users = users.filter(user => user.id !== id);
            localStorage.setItem("users", JSON.stringify(users));
        } catch (e) {
            console.log(e);
        }
    }

    setCachedCurrentUser(userObj) {
        localStorage.setItem("currentUser", JSON.stringify(userObj));
    }

    deleteCachedCurrentUser() {
        localStorage.removeItem("currentUser");
    }

    getCachedUser() {
        return this.getCookieValue("userId");
    }

    getCachedSpace() {
        return this.getCookieValue("currentSpaceId")
    }

    getCookieValue(cookieName) {
        const name = cookieName + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return null;
    }

    async createPersonalSpace(userName) {
        return await system.storage.createSpace(`${userName.endsWith("s") ? userName + "'" : userName + "'s"} Space`);
    }

    async removeSpaceFromUser(userId, spaceId) {
        let user = await system.storage.loadUser(userId);
        user.spaces = user.spaces.filter(space => space.id !== spaceId);
        await system.storage.storeUser(userId, JSON.stringify(user));
    }

    async registerUser(userData) {
        const randomNr = crypto.generateRandom(32);
        const secretToken = crypto.encrypt(randomNr, crypto.deriveEncryptionKey(userData.password));
        delete userData.password;

        userData.secretToken = secretToken;
        userData.id = system.services.generateId();

        let defaultSpace = this.createPersonalSpace(userData.name);
        userData.spaces = [{name: defaultSpace.name, id: defaultSpace.id}];
        userData.currentSpaceId = defaultSpace.id;
        //const didDocument = await $$.promisify(w3cDID.createIdentity)("key", undefined, randomNr);
        try {
            let result = await system.storage.storeUser(userData.id, JSON.stringify(userData));
            system.user = JSON.parse(result);
            this.setUserCookie(userData.id);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    setUserCookie(userId) {
        let expires = new Date();
        expires.setTime(expires.getTime() + (30 * 24 * 60 * 60 * 1000));
        document.cookie = `userId=${userId}; expires=${expires.toUTCString()}; path=/;`;
    }

    verifyConfirmationLink() {
        let user = {id: system.user.id, secretToken: system.user.secretToken};
        this.addCachedUser(user);
        this.setCachedCurrentUser(user);
    }

    async loginUser(email, password) {
        const userString = await this.getStoredUserByEmail(email);
        try {
            let userObj = JSON.parse(userString);
            const userId = userObj.id;

            let users = this.getCachedUsers();
            if (users) {
                users = JSON.parse(users);
                for (let user of users) {
                    if (user.id === userId) {
                        let secretToken = user.secretToken;
                        if (this.verifyPassword(secretToken, password)) {
                            this.setCachedCurrentUser({id: userId, secretToken: secretToken});
                            /* TODO replace with better logic after APIs are implemented */
                            this.setUserCookie(userId);
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            }
            return false;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async loginFirstTimeUser(email, password) {
        const userString = await this.getStoredUserByEmail(email);
        try {
            let userObj = JSON.parse(userString);
            const userId = userObj.id;
            console.log(`First time logging in on this device userId: ${JSON.stringify(userId)}`);
            const result = await this.getStoredUser(userId);
            const storedUser = JSON.parse(result);
            if (this.verifyPassword(storedUser.secretToken, password)) {
                if (storedUser.spaces && storedUser.spaces.length > 0) {
                    system.user = {
                        id: storedUser.id,
                        secretToken: storedUser.secretToken,
                        spaces: storedUser.spaces,
                        currentSpaceId: storedUser.spaces[0].id
                    }
                } else {
                    let defaultSpace = await this.createPersonalSpace(storedUser.name);
                    system.user = {
                        id: storedUser.id,
                        secretToken: storedUser.secretToken,
                        spaces: [{name: defaultSpace.name, id: defaultSpace.id}],
                        currentSpaceId: defaultSpace.id
                    }
                    await this.addSpaceToUser(userId, defaultSpace);
                }
                this.setUserCookie(userId);
                return true;
            } else {
                return false;
            }
        } catch (e) {
            console.log(e);
            return false;
        }

    }

    async recoverPassword(email, password) {
        const userString = await this.getStoredUserByEmail(email);
        try {
            let userObj = JSON.parse(userString);
            const randomNr = crypto.generateRandom(32);
            userObj.temporarySecretToken = crypto.encrypt(randomNr, crypto.deriveEncryptionKey(password));
            let result = await this.updateStoredUser(userObj);
            try {
                result = JSON.parse(result);
                system.user = result;
                console.log(result);

                return true;
            } catch (e) {
                console.error(e);
                return false;
            }
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async confirmRecoverPassword() {
        const user = JSON.parse(await this.getStoredUser(system.user.id));
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
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async addSpaceToUser(userId, newSpace) {
        let user = await system.storage.loadUser(userId);
        if (user.spaces) {
            user.spaces.push({name: newSpace.name, id: newSpace.id});
        } else {
            user.spaces = [{name: newSpace.name, id: newSpace.id}];
        }
        user.currentSpaceId = newSpace.id;
        await system.storage.storeUser(userId, JSON.stringify(user));
    }

    async getStoredUser(userId) {
        return await system.storage.loadUser(userId);
    }

    async addKeyToSpace(spaceId, userId, keyType, apiKey) {
        return system.storage.addKeyToSpace(spaceId, userId, keyType, apiKey);
    }

    async getStoredUserByEmail(email) {
        return await system.storage.loadUserByEmail(email);
    }

    async updateStoredUser(updatedUser) {
        return await system.storage.storeUser(updatedUser.id, JSON.stringify(updatedUser));
    }

    async storeGITCredentials(stringData) {
        return await system.storage.storeGITCredentials(system.space.id, system.user.id, stringData);
    }

    async getUsersSecretsExist() {
        return await system.storage.getUsersSecretsExist(system.space.id);
    }
}