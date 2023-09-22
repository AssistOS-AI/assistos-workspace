import {IndexDBWrapper} from "../../utils/indexDBWrapepr.js";
import {StorageService} from "./storageService.js";

export class IndexedDBService_obsolete extends StorageService {
    constructor(dbName, version) {
        super();
        if (IndexedDBService_obsolete.instance) {
            return IndexedDBService_obsolete.instance;
        } else {
            IndexedDBService_obsolete.instance = this;
            this.dbName = dbName;
            this.version = version;
            this.indexDBWrapper = new IndexDBWrapper();
        }
    }

    static getInstance(dbName, version) {
        if (!this.instance) {
            this.instance = new IndexedDBService_obsolete(dbName, version);
        }
        return this.instance;
    }

    async initDatabase() {
        if (!this.db) {
            this.db = await this.indexDBWrapper.openDatabase(this.dbName, this.version);
        }
        return this.db;
    }

    async loadJSON(companyId, objectID) {
        const company = await this.indexDBWrapper.getRecord(this.db, 'companies', companyId);
        if (!company) return null;
        function findNestedObjectById(obj, id) {
            if (obj.id === id) {
                return obj;
            }
            for (let key in obj) {
                if (typeof obj[key] === "object") {
                    const found = findNestedObjectById(obj[key], id);
                    if (found) return found;
                }
            }
            return null;
        }
        return findNestedObjectById(company, objectID);
    }
    /* Cum identific unde trebuie adaugat obiectul daca facem add la ceva la indexedDB? */
    /* Dam toate datele companiei in constructor sau avem o functie separata de load in clasa company pentru a
       folosi storageService?
     */
    /* De ce avem loadDocument in documentFactory daca avem deja toate datele documentului in clasa company */

    async storeJSON(companyId, objectID, jsonData) {
        return await this.indexDBWrapper.addRecord(this.db, companyId, jsonData);
    }

    async getDatabaseData() {
        return await this.indexDBWrapper.getAllRecords(this.db);
    }

    /* Companies */
    async getAllCompaniesData() {
        return await this.indexDBWrapper.getTableRecords(this.db, 'companies');
    }

    async getCompanyData(companyId) {
        return await this.indexDBWrapper.getRecord(this.db, 'companies', companyId);
    }

    async addCompany(company) {
        return await this.indexDBWrapper.addRecord(this.db, 'companies', company);
    }

    async deleteCompany(companyId) {
        return await this.indexDBWrapper.deleteRecord(this.db, 'companies', companyId);
    }

    /* Documents */
    async getCompanyDocuments(companyId) {
        const company = await this.indexDBWrapper.getRecord(this.db, 'companies', companyId);
        return company ? company.documents : [];
    }

    async getDocument(companyId, documentId) {
        const company = await this.indexDBWrapper.getRecord(this.db, 'companies', companyId);
        return company ? company.documents.find(doc => doc.id === documentId) : null;
    }

    async addDocument(newDocument, companyId) {
        const company = await this.indexDBWrapper.getRecord(this.db, "companies", companyId);
        if (company) {
            if (newDocument.id !== undefined) {
                const existingDocument = company.documents.find(doc => doc.id === newDocument.id);
                if (existingDocument) {
                    throw new Error('Document already exists within the company');
                } else {
                    newDocument.id = company.documents.length + 1;
                    company.documents.push(newDocument);
                    return await this.indexDBWrapper.updateRecord(this.db, "companies", companyId, company);
                }
            } else {
                newDocument.id = company.documents.length + 1;
                company.documents.push(newDocument);
                await this.indexDBWrapper.updateRecord(this.db, "companies", companyId, company);
                return newDocument.id;
            }
        } else {
            throw new Error('Company not found');
        }
    }

    async updateDocument(companyId, documentId, updatedDocument) {
        const company = await this.indexDBWrapper.getRecord(this.db, "companies", companyId);
        if (company) {
            const existingDocumentIndex = company.documents.findIndex(doc => doc.id === documentId);
            if (existingDocumentIndex !== -1) {
                company.documents[existingDocumentIndex] = updatedDocument;
                return await this.indexDBWrapper.updateRecord(this.db, "companies", companyId, company);
            } else {
                throw new Error('Document does not exist within the company');
            }
        } else {
            throw new Error('Company not found');
        }
    }

    async deleteDocument(companyId, documentId) {
        const company = await this.indexDBWrapper.getRecord(this.db, 'companies', companyId);
        if (company) {
            const existingDocumentIndex = company.documents.findIndex(doc => doc.id === documentId);
            if (existingDocumentIndex !== -1) {
                company.documents.splice(existingDocumentIndex, 1);
                return await this.indexDBWrapper.updateRecord(this.db, 'companies', companyId, company);
            } else {
                throw new Error('Document does not exist within the company');
            }
        } else {
            throw new Error('Company not found');
        }
    }
}