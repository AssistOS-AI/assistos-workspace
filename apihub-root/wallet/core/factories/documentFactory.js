import { DocumentModel } from "../../imports.js";

export class DocumentFactory {
    static createDocument() {
        let openDSU = require("opendsu");
        let crypto = openDSU.loadApi("crypto");
        let documentData = {id: crypto.getRandomSecret(16).toString().split(",").join("")};
        return new DocumentModel(documentData);
    }

    static async loadDocument(docId) {
        let documentPath = "documents/" + docId;
        let docJson = await webSkel.storageService.loadObject(documentPath, docJson);
        let documentModel = JSON.parse(docJson);
        return new DocumentModel(documentModel);
    }

    static async storeDocument(spaceId, documentModel) {
        await storageManager.storeObject(spaceId, "documents", documentModel.id, documentModel.stringifyDocument());
    }

    static async deleteDocument(spaceId, documentId) {
        await storageManager.storeObject(currentSpaceId, "documents", documentId, "");
    }
}