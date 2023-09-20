import { DocumentModel } from "../../imports.js";

export class DocumentFactory {
    constructor() {

    }

    createDocument(documentData) {
        return new DocumentModel(documentData);
    }
    //lucrul cu storageService
}