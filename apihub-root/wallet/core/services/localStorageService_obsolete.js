import {StorageService} from "./storageService.js";
export class LocalStorageService_obsolete extends StorageService {
    constructor(localStorageWrapper) {
        super();
        this.wrapper = localStorageWrapper;
    }

    loadJSON(companyId, objectID) {
        return this.wrapper.get(`${companyId}-${objectID}`);
    }

    storeJSON(companyId, objectID, jsonData) {
        this.wrapper.set(`${companyId}-${objectID}`, jsonData);
    }
}
