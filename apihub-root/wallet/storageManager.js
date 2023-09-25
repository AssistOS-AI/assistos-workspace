
export class StorageManager {
    constructor() {
        this.services = {};
    }
    addStorageService(name, service) {
        this.services[name] = service;
    }

    getStorageService(name) {
        return this.services[name];
    }

    async loadObject(serviceName, spaceId, objectType, objectName) {
        const service = this.getStorageService(serviceName);
        if (!service) throw new Error("Service not found");
        return await service.loadObject(spaceId, objectType, objectName);
    }

    async storeObject(serviceName, spaceId, objectType, objectName, jsonData) {
        const service = this.getStorageService(serviceName);
        if (!service) throw new Error("Service not found");
        await service.storeObject(spaceId, objectType, objectName, jsonData);
    }

    async listObjects(serviceName, spaceId, objectType) {
        const service = this.getStorageService(serviceName);
        if (!service) throw new Error("Service not found");
        await service.storeObject(spaceId, objectType);
    }
}
