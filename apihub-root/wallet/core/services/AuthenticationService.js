const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");
import {Space, User} from '../../imports.js'

export class AuthenticationService {

    constructor() {
    }

    async initUser(spaceId) {
        system.user = new User(await system.storage.loadUser());
        const spaceData = await system.storage.loadSpace(spaceId)
        system.space = new Space(spaceData);
        await system.space.loadFlows();
        await system.space.loadApplicationsFlows();
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

    getDemoUserCredentials() {
        try {
            const demoUserCredentials= JSON.parse(this.getCookieValue("demoCredentials"));
            return [demoUserCredentials.email, demoUserCredentials.password]
        } catch (error) {
            console.log(error+"No demo credentials found")
            return ["",""];
        }
    }

    async registerUser(name, email, password) {
        return await system.storage.registerUser(name, email, password);

    }

    async activateUser(activationToken) {
        return await system.storage.activateUser(activationToken);
    }

    async loginUser(email, password) {
        return await system.storage.loginUser(email, password);
    }

    async logoutUser() {
        return await system.storage.logoutUser();
    }

    async addKeyToSpace(spaceId, userId, keyType, apiKey) {
        return system.storage.addKeyToSpace(spaceId, userId, keyType, apiKey);
    }

    async storeGITCredentials(stringData) {
        return await system.storage.storeGITCredentials(system.space.id, system.user.id, stringData);
    }

    async getUsersSecretsExist() {
        return await system.storage.getUsersSecretsExist(system.space.id);
    }
}