
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

    async loadObject(serviceName, companyId, objectID) {
        const service = this.getStorageService(serviceName);
        if (!service) throw new Error("Service not found");
        return await service.loadObject(companyId, objectID);
    }

    async storeObject(serviceName, companyId, objectID, jsonData) {
        const service = this.getStorageService(serviceName);
        if (!service) throw new Error("Service not found");
        await service.storeObject(companyId, objectID, jsonData);
    }
}
