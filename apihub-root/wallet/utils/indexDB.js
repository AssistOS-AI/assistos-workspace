    export async function getTableRecords(db,storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readonly");
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
    export async function getAllRecords(db) {

        return new Promise(async (resolve, reject) => {
            const objectStoreNames = Array.from(db.objectStoreNames);

            let allData = {};

            try {
                for (let storeName of objectStoreNames) {
                    allData[storeName] = await getTableRecords(db,storeName);
                }
                resolve(allData);
            } catch (error) {
                console.error(`Encountered IndexDB error: ${error} while fetching all data.`);
                reject(error);
            }
        });
    }
    export async function getRecord(db,storeName, key) {
        return new Promise((resolve, reject) => {
            if (!db.objectStoreNames.contains(storeName)) {
                reject(`Object store "${storeName}" does not exist.`);
                return;
            }
            const transaction = db.transaction(storeName, "readonly");
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.get(key);
            request.onsuccess = (event) => {
                resolve(event.target.result || null);
            };
            request.onerror = (event) => {
                console.error(`Encountered IndexDB error: ${event.target.error} while fetching record with key ${key} from ${storeName}.`);
                reject(event.target.error);
            };
        });
    }

    export async function addRecord(db,storeName, data) {
        if (!db.objectStoreNames.contains(storeName)) {
            throw new Error(`Object store "${storeName}" does not exist.`);
        }
        /* Adding a new Document and let indexedDB auto-assign an id*/
        if(data.id!==undefined) {
            const existingRecord = await getRecord(db,storeName, data.id);

            if (existingRecord) {
                return;
            }
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readwrite");
            const objectStore = transaction.objectStore(storeName);
            const addRequest = objectStore.add(data);

            addRequest.onsuccess = () => resolve(addRequest.result);
            addRequest.onerror = event => reject(new Error(`Encountered IndexDB error: ${event.target.error} while adding data to ${storeName}.`));

            transaction.onerror = event => reject(event.target.error);
            transaction.onabort = event => reject(new Error('Transaction was aborted'));
        });
    }

    export async function deleteRecord(db,storeName, key) {
        return new Promise((resolve, reject) => {

            if (!db.objectStoreNames.contains(storeName)) {
                reject(`Object store "${storeName}" does not exist.`);
                return;
            }

            const transaction = db.transaction(storeName, "readwrite");
            const objectStore = transaction.objectStore(storeName);
            let request;

            request = objectStore.delete(key);

            request.onsuccess = () => {
                resolve(`Record with key ${key} successfully deleted from ${storeName}.`);
            };

            request.onerror = (event) => {
                console.error(`Encountered IndexDB error: ${event.target.error} while deleting record with key ${key} from ${storeName}.`);
                reject(event.target.error);
            };
        });
    }