
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

    async getRecord(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, "readonly");
            const objectStore = transaction.objectStore(storeName);

            const request = objectStore.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                console.error(`Encountered IndexDB error: ${event.target.error} while fetching data from ${storeName}.`);
                reject(event.target.error);
            };
        });
    }
    async getAllRecords() {
        return new Promise(async (resolve, reject) => {
            const objectStoreNames = Array.from(this.db.objectStoreNames);

            let allData = {};

            try {
                for (let storeName of objectStoreNames) {
                    allData[storeName] = await this.getRecord(storeName);
                }
                resolve(allData);
            } catch (error) {
                console.error(`Encountered IndexDB error: ${error} while fetching all data.`);
                reject(error);
            }
        });
    }
    async addRecord(storeName, data) {
        return new Promise((resolve, reject) => {

            if (!this.db.objectStoreNames.contains(storeName)) {
                reject(`Object store "${storeName}" does not exist.`);
                return;
            }

            const transaction = this.db.transaction(storeName, "readwrite");
            const objectStore = transaction.objectStore(storeName);

            const request = objectStore.add(data);

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                console.error(`Encountered IndexDB error: ${event.target.error} while adding data to ${storeName}.`);
                reject(event.target.error);
            };
        });
    }
    async deleteRecord(storeName, key) {
        return new Promise((resolve, reject) => {
            // Ensure that the storeName exists
            if (!this.db.objectStoreNames.contains(storeName)) {
                reject(`Object store "${storeName}" does not exist.`);
                return;
            }

            const transaction = this.db.transaction(storeName, "readwrite");
            const objectStore = transaction.objectStore(storeName);

            const request = objectStore.delete(key);

            request.onsuccess = () => {
                resolve(`Record with key ${key} successfully deleted from ${storeName}.`);
            };

            request.onerror = (event) => {
                console.error(`Encountered IndexDB error: ${event.target.error} while deleting record with key ${key} from ${storeName}.`);
                reject(event.target.error);
            };
        });
    }

}
