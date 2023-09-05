import { Document } from "../../imports.js";

export class Registry {
    constructor(storageData) {
        if (Registry.instance) {
            return Registry.instance;
        }

        this.storageData = storageData ? storageData : [];
        this.storageData.documents = (storageData.documents || []).map(docData =>
            new Document(docData.name, docData.id, docData.abstract, docData.chapters, docData.settings)
        );
        if (storageData.documents && storageData.documents.length > 0) {
            this.currentDocumentId = storageData.documents[0].id;
        } else {
            this.currentDocumentId = undefined;
        }
        Registry.instance = this;
    }

    static getInstance(storageData) {
        if(!this.instance) {
            this.instance = new Registry(storageData);
        }
        return this.instance;
    }

    setDocSettings(documentId, settings){
        const document = this.storageData.documents.find(document => document.id === documentId);
        document.settings = settings;
        webSkel.localStorage.setDocSettings(documentId, settings);
    }

    getDocSettings(documentId) {
        const documentSettings = this.storageData.documents.find(document => document.id === documentId).settings;
        return documentSettings || null;
    }

    listDocuments() {
        return this.storageData.documents || [];
    }

    getDocument(documentId) {
        const document = this.storageData.documents.find(document => document.id === documentId);
        return document || null;
    }

    swapChapters(documentId, chapterId1, chapterId2) {
        const document = this.storageData.documents.find(document => document.id === documentId);
        document.swapChapters(chapterId1, chapterId2);
        webSkel.localStorage.updateDocument(documentId, document);
    }

    getAllDocuments() {
        return this.storageData.documents;
    }

    observeDocument(documentId){
        if(this.storageData.documents.find(document => document.id === documentId))
            this.currentDocument = documentId;
    }

    addDocument(document) {
        this.storageData.documents.push(document);
        webSkel.localStorage.addDocument(document);

    }

    deleteDocument(documentId) {
        const index = this.storageData.documents.findIndex(document => document.id === documentId);
        if (index !== -1) {
            this.storageData.documents.splice(index, 1);
            webSkel.localStorage.deleteDocument(documentId);
        }
    }

    updateDocument(documentId, document) {
        const index = this.storageData.documents.findIndex(document => document.id === documentId);
        if (index !== -1) {
            this.storageData.documents[index] = document;
            webSkel.localStorage.updateDocument(documentId, document);
        }
    }

    addLLM(llm) {
        this.storageData.llms.push(llm);
        webSkel.localStorage.addLLM(llm);
    }

    listLLMs() {
        return this.storageData.llms||[];
    }

    addPersonality(personality) {
        this.storageData.personalities.push(personality);
        webSkel.localStorage.addPersonality(personality);
    }

    listPersonalities() {
        return this.storageData.personalities||[];
    }
}
