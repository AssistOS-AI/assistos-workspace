
/* pass storage data as constructor parameter */
/* both the user and company know of each other */
/* the user has a list of company, and the company has a list of users */

import { Document } from "../imports.js";

export class Company {
    constructor(companyData) {
        if (Company.instance) {
            return Company.instance;
        }
        this.companyData = companyData ? companyData: [];
        this.id= this.companyData.id;
        this.documents= this.companyData.documents.map(docData =>
            new Document(docData.name, docData.id, docData.abstract, docData.chapters, docData.settings));
        if (this.documents && this.documents.length > 0) {
            this.currentDocumentId = this.documents[0].id;
        } else {
            this.currentDocumentId = undefined;
        }
        this.observers = [];
        Company.instance=this;
    }

    static getInstance(companyData) {
        if(!this.instance) {
            this.instance = new Company(companyData);
        }
        return this.instance;
    }

    onChange(observerFunction) {
        this.observers.push(new WeakRef(observerFunction));
    }

    notifyObservers() {
          for (const observerRef of this.observers) {
            const observer = observerRef.deref();
            if (observer) {
                observer(this.companyData);
            }
        }
    }
    observeDocument(documentId){
        if(this.companyData.documents.find(document => document.id === documentId))
            this.currentDocumentId = documentId;
    }
    getAllDocuments() {
        return this.companyData.documents||[];
    }
    getDocument(documentId) {
        const document = this.companyData.documents.find(document => document.id === documentId);
        return document || null;
    }

    async addDocument(document) {
        this.companyData.documents.push(document);
        await webSkel.localStorage.addDocument(document);
    }

    async deleteDocument(documentId) {
        const index = this.companyData.documents.findIndex(document => document.id === documentId);
        if (index !== -1) {
            this.companyData.documents.splice(index, 1);
            await webSkel.localStorage.deleteDocument(this.id,documentId);
            this.notifyObservers();
        }
    }

    async updateDocument(documentId, document) {
        const index = this.companyData.documents.findIndex(document => document.id === documentId);
        if (index !== -1) {
            this.companyData.documents[index] = document;
            await webSkel.localStorage.updateDocument(documentId, document);
        }
    }

    async addLLM(llm) {
        this.companyData.llms.push(llm);
        await webSkel.localStorage.addLLM(llm);
    }

    getLLMs() {
        return this.companyData.llms||[];
    }

    getPersonalities() {
        return this.companyData.personalities||[];
    }
    async addPersonality(personality) {
        await webSkel.localStorage.addPersonality(personality);
        this.companyData.personalities.push(personality);
    }

    getDocSettings(documentId) {
        const documentSettings = this.companyData.documents.find(document => document.id === documentId).settings;
        return documentSettings || [];
    }
    async setDocSettings(documentId, settings){
        const document = this.companyData.documents.find(document => document.id === documentId);
        document.settings = settings;
        await webSkel.localStorage.setDocSettings(documentId, settings);
    }
}