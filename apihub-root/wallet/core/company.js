/* pass storage data as constructor parameter */
/* both the user and company know of each other */
/* the user has a list of company, and the company has a list of users */

import { Document } from "../imports.js";

export class Company {
    constructor(companyData) {
        if (Company.instance) {
            return Company.instance;
        }
        this.id = companyData.id || undefined;
        this.documents = companyData.documents.map(docData => new Document(docData.title, docData.id, docData.abstract, docData.chapters, docData.settings));
        if (this.documents && this.documents.length > 0) {
            this.currentDocumentId = this.documents[0].id;
        } else {
            this.currentDocumentId = undefined;
        }
        this.observers = [];
        Company.instance = this;
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
        if(this.documents.find(document => document.id === documentId))
            this.currentDocumentId = documentId;
    }

    getAllDocuments() {
        return this.documents || [];
    }

    swapChapters(documentId, chapterId1, chapterId2) {
        const document = this.documents.find(document => document.id === documentId);
        document.swapChapters(chapterId1, chapterId2);
        webSkel.localStorage.updateDocument(this.id, documentId, document);
    }

    getDocument(documentId) {
        const document = this.documents.find(document => document.id === documentId);
        return document || null;
    }

    async addDocument(document) {
        document.id = await webSkel.localStorage.addDocument(document, company.id);
        this.documents.push(document);
        this.notifyObservers();
    }

    async deleteDocument(documentId) {
        const index = this.documents.findIndex(document => document.id === documentId);
        if (index !== -1) {
            this.documents.splice(index, 1);
            await webSkel.localStorage.deleteDocument(this.id, documentId);
            this.notifyObservers();
        }
    }

    async updateDocument(documentId, document) {
        const index = this.documents.findIndex(document => document.id === documentId);
        if (index !== -1) {
            this.documents[index] = document;
            await webSkel.localStorage.updateDocument(company.id, documentId, document);
            this.notifyObservers();
        }
    }

    async addLLM(llm) {
        this.llms.push(llm);
        await webSkel.localStorage.addLLM(llm);
        this.notifyObservers();
    }

    getLLMs() {
        return this.llms || [];
    }

    getPersonalities() {
        return this.personalities || [];
    }

    async addPersonality(personality) {
        await webSkel.localStorage.addPersonality(personality);
        this.personalities.push(personality);
    }

    getDocSettings(documentId) {
        const documentSettings = this.documents.find(document => document.id === documentId).settings;
        return documentSettings || [];
    }
    async setDocSettings(documentId, settings){
        const document = this.documents.find(document => document.id === documentId);
        document.settings = settings;
        await webSkel.localStorage.setDocSettings(documentId, settings);
    }
}