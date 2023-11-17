
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
    async storeSpace(spaceId, jsonData) {
       return  await this.currentService.storeSpace(spaceId, jsonData);
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

    async loadDefaultScripts(){
        return await this.currentService.loadDefaultScripts();
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
}
