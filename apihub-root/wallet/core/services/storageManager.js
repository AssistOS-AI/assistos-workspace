
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

    setCurrentService(name){
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
    async storeSpace(space) {
       let response = await this.currentService.storeSpace(space.id, space.stringifySpace());
       let response2 = await this.currentService.storeFlows(space.id, space.stringifyFlows());
       return response + " " + response2;
    }

    async listObjects(spaceId, objectType) {
        return await this.currentService.storeObject(spaceId, objectType);
    }

    async storeUser(userId, jsonData) {
        return await this.currentService.storeUser(userId, jsonData);
    }
    async loadUser(userId){
        return await this.currentService.loadUser(userId);
    }

    async loadUserByEmail(email){
        return await this.currentService.loadUserByEmail(email);
    }
    async loadFlows(spaceId){
        return await this.currentService.loadFlows(spaceId);
    }
    async storeFlow(spaceId, objectName, jsData){
        return await this.currentService.storeFlow(spaceId, objectName, jsData);
    }
    async loadDefaultFlows(){
        return await this.currentService.loadDefaultFlows();
    }
    async loadDefaultPersonalities(){
        return await this.currentService.loadDefaultPersonalities();
    }
    async loadDefaultAgent(){
        return await this.currentService.loadDefaultAgent();
    }
    async loadFilteredKnowledge(words, agentId){
        return await this.currentService.loadFilteredKnowledge(words, agentId);
    }

    //applications
    async installApplication(spaceId, appName){
        return await this.currentService.installApplication(spaceId, appName);
    }
    async getApplicationConfigs(spaceId, appId){
        return await this.currentService.getApplicationConfigs(spaceId, appId);
    }
    async getApplicationFile(spaceId, appId, filePath){
        return await this.currentService.getApplicationFile(spaceId, appId, filePath);
    }
    async loadPresenter(spaceId, appId, presenterName){
        return await this.currentService.loadPresenter(spaceId, appId, presenterName);
    }
    async loadManager(spaceId, appId, managerName){
        return await this.currentService.loadManager(spaceId, appId, managerName);
    }
 /*   async loadService(spaceId, appId, serviceName) {
        return await this.currentService.loadService(spaceId,appId,serviceName);
    }*/
    async loadAppFlows(spaceId, appName){
        return await this.currentService.loadAppFlows(spaceId, appName);
    }
    async storeAppFlow(spaceId, appName, objectId, jsData){
        return await this.currentService.storeAppFlow(spaceId, appName, objectId, jsData)
    }
    async storeAppObject(spaceId, appName, objectType, objectId, stringData){
        return await this.currentService.storeAppObject(spaceId, appName, objectType, objectId, stringData);
    }
    async uninstallApplication(spaceId, appName) {
        return await this.currentService.uninstallApplication(spaceId, appName);
    }
    async reinstallApplication(spaceId, appName){
        return await this.currentService.reinstallApplication(spaceId, appName);
    }
}
