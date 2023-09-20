import { addRecord,
         getRecord,
         getAllRecords,
         getTableRecords,
         deleteRecord,
         openDatabase,
         updateRecord
} from "../../imports.js";

export class storageService {
    constructor(dbName, version) {
        if (storageService.instance) {
            return storageService.instance;
        } else {
            storageService.instance = this;
            this.dbName = dbName;
            this.version = version;
        }
    }

    static getInstance(dbName, version) {
        if(!this.instance) {
            this.instance = new storageService(dbName, version);
        }
        return this.instance;
    }

    async initDatabase() {
        if (!this.db) {
            this.db = await openDatabase(this.dbName, this.version);
        }
        return this.db;
    }

    async getAllData() {
        return await getAllRecords(this.db);
    }

    /* Spaces */
    async getAllSpacesData() {
        return await getTableRecords(this.db, 'spaces');
    }

    async getSpaceData(spaceId) {
        return await getRecord(this.db, 'spaces', spaceId);
    }

    async addSpace(space) {
        return await addRecord(this.db, 'spaces', space);
    }

    async deleteSpace(spaceId) {
        return await deleteRecord(this.db, 'spaces', spaceId);
    }

    /* Documents */
    async getSpaceDocuments(spaceId) {
        const space = await getRecord(this.db, 'spaces', spaceId);
        return space ? space.documents : [];
    }

    async getDocument(spaceId, documentId) {
        const space = await getRecord(this.db, 'spaces', spaceId);
        return space ? space.documents.find(doc => doc.id === documentId) : null;
    }

    async addDocument(newDocument, spaceId) {
        const space = await getRecord(this.db, "spaces", spaceId);
        if(space) {
            if(newDocument.id !== undefined) {
                const existingDocument = space.documents.find(doc => doc.id === newDocument.id);
                if (existingDocument) {
                    throw new Error('Document already exists within the space');
                } else {
                    newDocument.id = space.documents.length + 1;
                    space.documents.push(newDocument);
                    return await updateRecord(this.db, "spaces", spaceId, space);
                }
            } else {
                newDocument.id = space.documents.length+1;
                space.documents.push(newDocument);
                await updateRecord(this.db, "spaces", spaceId, space);
                return newDocument.id;
            }
        } else {
            throw new Error('Space not found');
        }
    }

    async updateDocument(spaceId, documentId, updatedDocument) {
        const space = await getRecord(this.db, "spaces", spaceId);
        if (space) {
            const existingDocumentIndex = space.documents.findIndex(doc => doc.id === documentId);
            if (existingDocumentIndex !== -1) {
                space.documents[existingDocumentIndex] = updatedDocument;
                return await updateRecord(this.db, "spaces", spaceId, space);
            } else {
                throw new Error('Document does not exist within the space');
            }
        } else {
            throw new Error('Space not found');
        }
    }

    async deleteDocument(spaceId, documentId) {
        const space = await getRecord(this.db, 'spaces', spaceId);
        if (space) {
            const existingDocumentIndex = space.documents.findIndex(doc => doc.id === documentId);
            if (existingDocumentIndex !== -1) {
                space.documents.splice(existingDocumentIndex, 1);
                return await updateRecord(this.db, 'spaces', spaceId, space);
            } else {
                throw new Error('Document does not exist within the space');
            }
        } else {
            throw new Error('Space not found');
        }
    }
}
