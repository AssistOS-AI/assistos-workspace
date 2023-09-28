import { DocumentModel } from "../../imports.js";

export class DocumentFactory {
    constructor() {
        this.observers = [];
    }
    createDocument() {
        let openDSU = require("opendsu");
        let crypto = openDSU.loadApi("crypto");
        let documentData = {id: crypto.getRandomSecret(16).toString().split(",").join("")};
        return new DocumentModel(documentData);
    }

    async loadDocument(docId) {
        let documentPath = "documents/" + docId;
        let docJson = await webSkel.storageService.loadObject(documentPath, docJson);
        let documentModel = JSON.parse(docJson);
        return new DocumentModel(documentModel);
    }

    async storeDocument(spaceId, documentModel) {
        await storageManager.storeObject(spaceId, "documents", documentModel.id, documentModel.stringifyDocument());
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