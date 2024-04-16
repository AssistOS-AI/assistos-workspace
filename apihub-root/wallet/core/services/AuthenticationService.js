const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");
import {Space, User} from '../../imports.js'

export class AuthenticationService {

    constructor() {
    }

    async initUser(spaceId) {
        assistOS.user = new User(await assistOS.storage.loadUser());
        const spaceData = await assistOS.storage.loadSpace(spaceId)
        assistOS.space = new Space(spaceData);
        await assistOS.space.loadFlows();
        await assistOS.space.loadApplicationsFlows();
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
        return await assistOS.storage.registerUser(name, email, password);

    }

    async activateUser(activationToken) {
        return await assistOS.storage.activateUser(activationToken);
    }

    async loginUser(email, password) {
        return await assistOS.storage.loginUser(email, password);
    }

    async logoutUser() {
        return await assistOS.storage.logoutUser();
    }

    async addKeyToSpace(spaceId, userId, keyType, apiKey) {
        return assistOS.storage.addKeyToSpace(spaceId, userId, keyType, apiKey);
    }

    async storeGITCredentials(stringData) {
        return await assistOS.storage.storeGITCredentials(assistOS.space.id, assistOS.user.id, stringData);
    }

    async getUsersSecretsExist() {
        return await assistOS.storage.getUsersSecretsExist(assistOS.space.id);
    }
}