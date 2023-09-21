import {DocumentModel} from "../../imports.js";

export class DocumentFactory{
    constructor() {
    }
    createDocument(documentData) {
        return new DocumentModel(documentData);
    }
    loadDocument(documentId){
        return storageManager.getStorageService("IndexedDBService").loadJSON(webSkel.company.id, documentId);
    }
}