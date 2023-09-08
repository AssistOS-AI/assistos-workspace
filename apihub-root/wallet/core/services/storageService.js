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

    /* Companies */
    async getAllCompaniesData() {
        return await getTableRecords(this.db, 'companies');
    }

    async getCompanyData(companyId) {
        return await getRecord(this.db, 'companies', companyId);
    }

    async addCompany(company) {
        return await addRecord(this.db, 'companies', company);
    }

    async deleteCompany(companyId) {
        return await deleteRecord(this.db, 'companies', companyId);
    }

    /* Documents */
    async getCompanyDocuments(companyId) {
        const company = await getRecord(this.db, 'companies', companyId);
        return company ? company.documents : [];
    }

    async getDocument(companyId, documentId) {
        const company = await getRecord(this.db, 'companies', companyId);
        return company ? company.documents.find(doc => doc.id === documentId) : null;
    }

    async addDocument(newDocument, companyId) {
        const company = await getRecord(this.db, "companies", companyId);
        if(company) {
            if(newDocument.id!==undefined) {
                const existingDocument = company.documents.find(doc => doc.id === newDocument.id);
                if (existingDocument) {
                    throw new Error('Document already exists within the company');
                } else {
                    newDocument.id=company.documents.length+1;
                    company.documents.push(newDocument);
                    return await updateRecord(this.db, "companies", companyId, company);
                }
            }else{
                newDocument.id=company.documents.length+1;
                company.documents.push(newDocument);
                await updateRecord(this.db, "companies", companyId, company);
                return newDocument.id;
            }
        } else {
            throw new Error('Company not found');
        }
    }

    async updateDocument(companyId, documentId, updatedDocument) {
        const company = await getRecord(this.db, "companies", companyId);
        if (company) {
            const existingDocumentIndex = company.documents.findIndex(doc => doc.id === documentId);
            if (existingDocumentIndex !== -1) {
                company.documents[existingDocumentIndex] = updatedDocument;
                return await updateRecord(this.db, "companies", companyId, company);
            } else {
                throw new Error('Document does not exist within the company');
            }
        } else {
            throw new Error('Company not found');
        }
    }"Lorem ipsum dolor sit amet, usu at facilis mandamus periculis. Ut aeterno forensibus nec, mea animal utamur in. In option regione temporibus sea, duo insolens hendrerit ex. Harum deleniti recusabo mea an, duo dicant deseruisse disputationi te, ei mei quot offendit. Eum vero minim virtute ex, ne tale porro vel. Eum te graecis phaedrum corrumpit, melius facilis perfecto qui te, ut eam iusto disputando. Ne lorem consetetur vim.gvjbknl<br>tyguhijlok;<br><br><br><br>fgv thjknlm;,.bgf vcBGFvkj<br><br><br>dv c<br><br>dffb"


    async deleteDocument(companyId, documentId) {
        const company = await getRecord(this.db, 'companies', companyId);
        if (company) {
            const existingDocumentIndex = company.documents.findIndex(doc => doc.id === documentId);
            if (existingDocumentIndex !== -1) {
                company.documents.splice(existingDocumentIndex, 1);
                return await updateRecord(this.db, 'companies', companyId, company);
            } else {
                throw new Error('Document does not exist within the company');
            }
        } else {
            throw new Error('Company not found');
        }
    }
}
