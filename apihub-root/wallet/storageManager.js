
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
        await this.currentService.storeObject(spaceId, objectType, objectName, jsonData);
    }

    async storeSpace(spaceId, jsonData) {
        await this.currentService.storeSpace(spaceId, jsonData);
    }

    async listObjects(spaceId, objectType) {
        await this.currentService.storeObject(spaceId, objectType);
    }
}
