
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

    async loadObject(serviceName, spaceId, objectID) {
        const service = this.getStorageService(serviceName);
        if (!service) throw new Error("Service not found");
        return await service.loadObject(spaceId, objectID);
    }

    async storeObject(serviceName, spaceId, objectID, jsonData) {
        const service = this.getStorageService(serviceName);
        if (!service) throw new Error("Service not found");
        await service.storeObject(spaceId, objectID, jsonData);
    }
}
