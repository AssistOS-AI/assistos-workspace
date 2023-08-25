
export default class liteUserDatabase {
    constructor(dbName, version) {
        if (liteUserDatabase.instance) {
            return liteUserDatabase.instance;
        } else {
            liteUserDatabase.instance = this;
            this.dbName = dbName;
            this.version = version;
        }
    }

    async init() {
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
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction("documents", "readwrite");
            const documentObjectStore = transaction.objectStore("documents");

            const request = documentObjectStore.add(document);

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                console.error(`Encountered error: ${event.target.error} while trying to add the document to the database`);
                reject(event.target.error);
            };
        });
    }
    async getDocuments() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction("documents", "readonly");
            const documentObjectStore = transaction.objectStore("documents");

            const request = documentObjectStore.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                console.error(`Encountered error: ${event.target.error} while trying to get the documents from the database`);
                reject(event.target.error);
            };
        });
    }

}
