import { DocumentModel } from "../../imports.js";

export class DocumentService {
    constructor() {
        this.observers = [];
    }
    createDocument(documentData) {
        return new DocumentModel(documentData);
    }

    async addDocument(spaceId, documentObj) {
        assistOS.space.documents.unshift(documentObj);
        await assistOS.storage.storeObject(spaceId, "documents", documentObj.id, documentObj.stringifyDocument());
    }
    async updateDocument(spaceId, documentObj) {
        await assistOS.storage.storeObject(spaceId, "documents", documentObj.id, documentObj.stringifyDocument());
    }

    async deleteDocument(spaceId, documentId) {
        assistOS.space.deleteDocument(documentId);
        await assistOS.storage.storeObject(assistOS.space.id, "documents", documentId, "");
    }

    observeChange(elementId, callback) {
        let obj = {elementId: elementId, callback: callback};
        callback.refferenceObject = obj;
        this.observers.push(new WeakRef(obj));
    }

    notifyObservers(prefix) {
        for (const observerRef of this.observers) {
            const observer = observerRef.deref();
            if(observer && observer.elementId.startsWith(prefix)) {
                observer.callback();
            }
        }
    }
}