import { DocumentModel } from "../../imports.js";

export class DocumentFactory {
    constructor() {
        this.observers = [];
    }
    createDocument(documentData) {
        return new DocumentModel(documentData);
    }

    async addDocument(spaceId, documentObj) {
        system.space.documents.unshift(documentObj);
        await system.storage.storeObject(spaceId, "documents", documentObj.id, documentObj.stringifyDocument());
    }
    async updateDocument(spaceId, documentObj) {
        await system.storage.storeObject(spaceId, "documents", documentObj.id, documentObj.stringifyDocument());
    }

    async deleteDocument(spaceId, documentId) {
        system.space.deleteDocument(documentId);
        await system.storage.storeObject(system.space.id, "documents", documentId, "");
    }

    observeChange(elementId, callback) {
        let obj = {elementId: elementId, callback: callback};
        callback.refferenceObject = obj;
        this.observers.push(new WeakRef(obj));
    }

    //doc:childId:paragraphId
    //a child can be not only a chapter, but also a title or abstract or mainIdea
    notifyObservers(prefix) {
        for (const observerRef of this.observers) {
            const observer = observerRef.deref();
            if(observer && observer.elementId.startsWith(prefix)) {
                observer.callback();
            }
        }
    }
}