import { StorageService } from "../services/storageService.js";
export class LocalStorageService_obsolete extends StorageService {
    constructor(localStorageWrapper) {
        super();
        this.wrapper = localStorageWrapper;
    }

    loadJSON(spaceId, objectID) {
        return this.wrapper.get(`${spaceId}-${objectID}`);
    }

    storeJSON(spaceId, objectID, jsonData) {
        this.wrapper.set(`${spaceId}-${objectID}`, jsonData);
    }
}
