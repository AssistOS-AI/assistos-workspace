import { DocumentModel } from "../../imports.js";

export class DocumentFactory {
    constructor() {
        this.observers = [];
    }
    createDocument(documentData) {
        documentData.id=webSkel.servicesRegistry.UtilsService.generateId();
        return new DocumentModel(documentData);
    }

    async loadDocument(docId) {
        let documentPath = "documents/" + docId;
        let docJson = await webSkel.storageService.loadObject(documentPath, docJson);
        let documentModel = JSON.parse(docJson);
        return new DocumentModel(documentModel);
    }

    async storeDocument(spaceId, documentObj) {
        webSkel.space.documents.push(documentObj);
        await storageManager.storeObject(spaceId, "documents", documentObj.id, documentObj.stringifyDocument());
    }

    async deleteDocument(spaceId, documentId) {
        webSkel.space.deleteDocument(documentId);
        await storageManager.storeObject(currentSpaceId, "documents", documentId, "");
    }

    observeChange(elementId, callback) {
        let obj = {elementId: elementId, callback: callback};
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