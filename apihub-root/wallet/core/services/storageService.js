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
    async getAllDataFromCompany(companyId) {
        return await getRecord(this.db, "companies", companyId);
    }
    async getAllCompanies() {
        try {
            const allRecords = await getTableRecords(this.db, "companies");
            return allRecords.map(company => ({ id: company.id, name: company.name }));
        } catch (error) {
            console.error(`Encountered an error while fetching all companies: ${error}`);
            return [];
        }
    }

    /* Documents */
    async getAllDocuments() {
        return await getTableRecords(this.db, "documents");
    }

    async getDocument(documentId) {
        return await getRecord(this.db, "documents", documentId);
    }

    async addDocument(document) {
        return await addRecord(this.db, "documents", document);
    }

    async updateDocument(documentId, docObject) {
        return await updateRecord(this.db, "documents", documentId, docObject);
    }

    async deleteDocument(documentId) {
        return await deleteRecord(this.db, "documents", documentId);
    }
}
