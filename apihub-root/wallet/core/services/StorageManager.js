export class StorageManager {
    constructor() {
        this.services = {};
        this.currentService = {};
    }

    addStorageService(name, service) {
        this.services[name] = service;
    }

    getStorageService(name) {
        return this.services[name];
    }

    setCurrentService(name) {
        const service = this.getStorageService(name);
        if (!service) throw new Error("Service not found");
        this.currentService = service;
    }

    async loadObject(spaceId, objectType, objectName) {
        return await this.currentService.loadObject(spaceId, objectType, objectName);
    }

    async loadSpace(spaceId) {
        return await this.currentService.loadSpace(spaceId);
    }

    async storeObject(spaceId, objectType, objectName, jsonData) {
        return await this.currentService.storeObject(spaceId, objectType, objectName, jsonData);
    }

    /* creating a new space */
    async storeSpace(spaceId, jsonData, apiKey, userId) {
        return await this.currentService.storeSpace(spaceId, jsonData, apiKey, userId);
    }

    async listObjects(spaceId, objectType) {
        return await this.currentService.storeObject(spaceId, objectType);
    }

    async storeUser(userId, jsonData) {
        return await this.currentService.storeUser(userId, jsonData);
    }

    async loadUser(userId) {
        return await this.currentService.loadUser(userId);
    }

    async loadUserByEmail(email) {
        return await this.currentService.loadUserByEmail(email);
    }

    async loadFlows(spaceId) {
        return await this.currentService.loadFlows(spaceId);
    }

    async storeFlow(spaceId, objectName, jsData) {
        return await this.currentService.storeFlow(spaceId, objectName, jsData);
    }

    async loadDefaultFlows() {
        return await this.currentService.loadDefaultFlows();
    }
    async addKeyToSpace(spaceId,userId,keyType,apiKey){
        return this.currentService.addKeyToSpace(spaceId,userId,keyType,apiKey);
    }
    async loadDefaultPersonalities() {
        return await this.currentService.loadDefaultPersonalities();
    }

    async loadDefaultAgent() {
        return await this.currentService.loadDefaultAgent();
    }

    async loadFilteredKnowledge(words, agentId) {
        return await this.currentService.loadFilteredKnowledge(words, agentId);
    }

    //applications
    async installApplication(spaceId, appName) {
        return await this.currentService.installApplication(spaceId, appName);
    }

    async getApplicationConfigs(spaceId, appId) {
        return await this.currentService.getApplicationConfigs(spaceId, appId);
    }

    async getApplicationComponent(spaceId, appId, appComponentsDirPath, component) {
        const HTMLPath = `${appComponentsDirPath}/${component.name}/${component.name}.html`
        const CSSPath = `${appComponentsDirPath}/${component.name}/${component.name}.css`
        let loadedTemplate = await (await this.getApplicationFile(spaceId, appId, HTMLPath)).text();
        let loadedCSSs = await (await this.getApplicationFile(spaceId, appId, CSSPath)).text();
        let presenterModule = "";
        if (component.presenterClassName) {
            const PresenterPath = `${appComponentsDirPath}/${component.name}/${component.name}.js`
            presenterModule = await this.getApplicationFile(spaceId, appId, PresenterPath);
        }
        loadedCSSs = [loadedCSSs];
        return {loadedTemplate, loadedCSSs, presenterModule};
    }

    async getApplicationFile(spaceId, appId, relativeAppFilePath) {
        return this.currentService.getApplicationFile(spaceId, appId, relativeAppFilePath);
    }

    /*   async loadService(spaceId, appId, serviceName) {
           return await this.currentService.loadService(spaceId,appId,serviceName);
       }*/
    async storeFlows(spaceId, flows) {
        return await this.currentService.storeFlows(spaceId, flows);
    }

    async loadAppFlows(spaceId, appName) {
        return await this.currentService.loadAppFlows(spaceId, appName);
    }

    async storeAppFlow(spaceId, appName, objectId, jsData) {
        return await this.currentService.storeAppFlow(spaceId, appName, objectId, jsData)
    }

    async storeAppObject(appName, objectType, objectId, stringData) {
        return await this.currentService.storeAppObject(appName, objectType, objectId, stringData);
    }

    async loadAppObjects(appName, objectType) {
        return await this.currentService.loadAppObjects(appName, objectType);
    }

    async uninstallApplication(spaceId, appName) {
        return await this.currentService.uninstallApplication(spaceId, appName);
    }

    /*GIT*/
    async storeGITCredentials(spaceId, userId, stringData) {
        return await this.currentService.storeGITCredentials(spaceId, userId, stringData);
    }

    async getUsersSecretsExist(spaceId) {
        return await this.currentService.getUsersSecretsExist(spaceId);
    }

    async deleteKey(spaceId,keyType, keyId) {
        return this.currentService.deleteKey(spaceId,keyType, keyId);
    }
}
