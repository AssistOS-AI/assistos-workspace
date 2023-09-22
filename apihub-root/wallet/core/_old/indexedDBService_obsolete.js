import {IndexDBWrapper} from "../../utils/indexDBWrapepr.js";
import {StorageService} from "../services/storageService.js";

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

    async loadJSON(spaceId, objectID) {
        const space = await this.indexDBWrapper.getRecord(this.db, 'spaces', spaceId);
        if (!space) return null;
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
        return findNestedObjectById(space, objectID);
    }
    /* Cum identific unde trebuie adaugat obiectul daca facem add la ceva la indexedDB? */
    /* Dam toate datele companiei in constructor sau avem o functie separata de load in clasa space pentru a
       folosi storageService?
     */
    /* De ce avem loadDocument in documentFactory daca avem deja toate datele documentului in clasa space */

    async storeJSON(spaceId, objectID, jsonData) {
        return await this.indexDBWrapper.addRecord(this.db, spaceId, jsonData);
    }

    async getDatabaseData() {
        return await this.indexDBWrapper.getAllRecords(this.db);
    }

    /* Spaces */
    async getAllSpacesData() {
        return await this.indexDBWrapper.getTableRecords(this.db, 'spaces');
    }

    async getSpaceData(spaceId) {
        return await this.indexDBWrapper.getRecord(this.db, 'spaces', spaceId);
    }

    async addSpace(space) {
        return await this.indexDBWrapper.addRecord(this.db, 'spaces', space);
    }

    async deleteSpace(spaceId) {
        return await this.indexDBWrapper.deleteRecord(this.db, 'spaces', spaceId);
    }

    /* Documents */
    async getSpaceDocuments(spaceId) {
        const space = await this.indexDBWrapper.getRecord(this.db, 'spaces', spaceId);
        return space ? space.documents : [];
    }

    async getDocument(spaceId, documentId) {
        const space = await this.indexDBWrapper.getRecord(this.db, 'spaces', spaceId);
        return space ? space.documents.find(doc => doc.id === documentId) : null;
    }

    async addDocument(newDocument, spaceId) {
        const space = await this.indexDBWrapper.getRecord(this.db, "spaces", spaceId);
        if (space) {
            if (newDocument.id !== undefined) {
                const existingDocument = space.documents.find(doc => doc.id === newDocument.id);
                if (existingDocument) {
                    throw new Error('Document already exists within the space');
                } else {
                    newDocument.id = space.documents.length + 1;
                    space.documents.push(newDocument);
                    return await this.indexDBWrapper.updateRecord(this.db, "spaces", spaceId, space);
                }
            } else {
                newDocument.id = space.documents.length + 1;
                space.documents.push(newDocument);
                await this.indexDBWrapper.updateRecord(this.db, "spaces", spaceId, space);
                return newDocument.id;
            }
        } else {
            throw new Error('Space not found');
        }
    }

    async updateDocument(spaceId, documentId, updatedDocument) {
        const space = await this.indexDBWrapper.getRecord(this.db, "spaces", spaceId);
        if (space) {
            const existingDocumentIndex = space.documents.findIndex(doc => doc.id === documentId);
            if (existingDocumentIndex !== -1) {
                space.documents[existingDocumentIndex] = updatedDocument;
                return await this.indexDBWrapper.updateRecord(this.db, "spaces", spaceId, space);
            } else {
                throw new Error('Document does not exist within the space');
            }
        } else {
            throw new Error('Space not found');
        }
    }

    async deleteDocument(spaceId, documentId) {
        const space = await this.indexDBWrapper.getRecord(this.db, 'spaces', spaceId);
        if (space) {
            const existingDocumentIndex = space.documents.findIndex(doc => doc.id === documentId);
            if (existingDocumentIndex !== -1) {
                space.documents.splice(existingDocumentIndex, 1);
                return await this.indexDBWrapper.updateRecord(this.db, 'spaces', spaceId, space);
            } else {
                throw new Error('Document does not exist within the space');
            }
        } else {
            throw new Error('Space not found');
        }
    }
}