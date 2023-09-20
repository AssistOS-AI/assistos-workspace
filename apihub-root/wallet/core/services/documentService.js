import { Chapter } from "../../imports.js";

export class documentService {
    observeDocument(documentId){
        if(webSkel.space.documents.find(document => document.id === documentId))
            webSkel.space.currentDocumentId = documentId;
    }

    getAllDocuments() {
        return webSkel.space.documents || [];
    }

    getDocument(documentId) {
        const document = webSkel.space.documents.find(document => document.id === documentId);
        return document || null;
    }

    getDocumentIndex(documentId) {
        return webSkel.space.documents.findIndex(document => document.id === documentId);
    }

    async addDocument(document) {
        document.id = await webSkel.localStorage.addDocument(document, webSkel.space.id);
        webSkel.space.documents.push(document);
        webSkel.space.notifyObservers();
    }

    async deleteDocument(documentId) {
        const index = webSkel.space.documents.findIndex(document => document.id === documentId);
        if (index !== -1) {
            webSkel.space.documents.splice(index, 1);
            await webSkel.localStorage.deleteDocument(webSkel.space.id, documentId);
            webSkel.currentDocumentId = null;
            webSkel.space.notifyObservers();
        }
    }

    async updateDocument(document, documentId) {
        const index = webSkel.space.documents.findIndex(document => document.id === documentId);
        if (index !== -1) {
            webSkel.space.documents[index] = document;
            await webSkel.localStorage.updateDocument(webSkel.space.id, documentId, document);
            webSkel.space.notifyObservers();
        }
    }
}