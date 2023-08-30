import {addRecord,getRecord,getAllRecords,getTableRecords,deleteRecord} from "../../imports.js";
export class localStorage {
    constructor(dbName, version) {
        if (localStorage.instance) {
            return localStorage.instance;
        } else {
            localStorage.instance = this;
            this.dbName = dbName;
            this.version = version;
        }
    }
    static getInstance(dbName, version) {
        if(!this.instance) {
            this.instance = new localStorage(dbName, version);
        }
        return this.instance;
    }
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const connectionRequest = indexedDB.open(this.dbName, this.version);

            connectionRequest.onerror = (event) => {
                console.error(`Encountered IndexDB error: ${event.target.error} while trying to load the database`);
                reject(event.target.error);
            };

            connectionRequest.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            connectionRequest.onupgradeneeded = (event) => {
                this.db = event.target.result;

                /* Define the default objectStores */

                if (!this.db.objectStoreNames.contains("documents")) {
                    const objectStore = this.db.createObjectStore("documents", {keyPath: "id", autoIncrement: true});
                    objectStore.createIndex("nameIndex", "name", {unique: true});
                }
            };
        });
    }
    async addDocument(document) {
        return await addRecord(this.db, "documents", document);
    }

    async getDocument(documentId) {
        return await getRecord(this.db, "documents", documentId);
    }

    async getAllDocuments() {
        return await getTableRecords(this.db, "documents");
    }

    async getAllData() {
        return await getAllRecords(this.db);
    }
    async deleteDocument(documentId) {
        return await deleteRecord(this.db, "documents", documentId);
    }
}
