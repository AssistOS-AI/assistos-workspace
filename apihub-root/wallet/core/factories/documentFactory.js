import { DocumentModel } from "../../imports.js";

export class DocumentFactory {
    constructor() {
        this.observers = [];
    }
    createDocument(documentData) {
        return new DocumentModel(documentData);
    }

    async loadDocument(docId) {
        let documentPath = "documents/" + docId;
        let docJson = await webSkel.storageService.loadObject(documentPath, docJson);
        let documentModel = JSON.parse(docJson);
        return new DocumentModel(documentModel);
    }

    async addDocument(spaceId, documentObj) {
        webSkel.currentUser.space.documents.unshift(documentObj);
        await storageManager.storeObject(spaceId, "documents", documentObj.id, documentObj.stringifyDocument());
    }
    async updateDocument(spaceId, documentObj) {
        await storageManager.storeObject(spaceId, "documents", documentObj.id, documentObj.stringifyDocument());
    }

    async deleteDocument(spaceId, documentId) {
        webSkel.currentUser.space.deleteDocument(documentId);
        await storageManager.storeObject(webSkel.currentUser.space.id, "documents", documentId, "");
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