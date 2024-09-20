const enclave = require('enclave');
const crypto = require("../apihub-component-utils/crypto.js");
const eventPublisher = require("../subscribers/eventPublisher");
const utils = require("./utils");

function getLightDBClient(spaceId) {
    return enclave.initialiseLightDBEnclave(spaceId);
}

//Container Objects
async function insertObjectRecords(lightDBClient, tableId, objectId, objectData) {
    let object = {};
    for (let key of Object.keys(objectData)) {
        if (Array.isArray(objectData[key])) {
            if (objectData[key].length > 0) {
                object[key] = [];
                if (typeof objectData[key][0] === "object") {
                    for (let item of objectData[key]) {
                        if (!item.id) {
                            item.id = `${key}_${crypto.generateId()}`;
                        }
                        object[key].push(item.id);
                        await insertObjectRecords(lightDBClient, tableId, item.id, item);
                    }
                } else {
                    //create a copy of the array
                    object[key] = Array.from(objectData[key]);
                }
            } else {
                object[key] = [];
            }
        } else {
            object[key] = objectData[key];
        }
    }
    await $$.promisify(lightDBClient.insertRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: object});
}

async function getContainerObject(spaceId, objectId) {
    function constructObject(recordsArray, objectId) {
        function getRecordDataAndRemove(recordsArray, pk) {
            const index = recordsArray.findIndex(item => item.pk === pk);
            if (index !== -1) {
                const record = recordsArray[index];
                recordsArray.splice(index, 1);
                return record.data;
            } else {
                return {};
            }
        }

        let object = getRecordDataAndRemove(recordsArray, objectId);
        for (let key of Object.keys(object)) {
            if (Array.isArray(object[key])) {
                for (let i = 0; i < object[key].length; i++) {
                    object[key][i] = constructObject(recordsArray, object[key][i]);
                }
            }
        }
        return object;
    }

    try {
        const lightDBClient = getLightDBClient(spaceId);
        let containerObjectRecords = await $$.promisify(lightDBClient.getAllRecords)($$.SYSTEM_IDENTIFIER, objectId);
        if (containerObjectRecords.length === 0) {
            throw (`Object with id: ${objectId} not found`);
        }
        return constructObject(containerObjectRecords, objectId);
    } catch (error) {
        throw error;
    }
}

async function getContainerObjectsMetadata(spaceId, objectType) {
    try {
        let lightDBClient = getLightDBClient(spaceId);
        let records = await $$.promisify(lightDBClient.getAllRecords)($$.SYSTEM_IDENTIFIER, objectType);
        let metadata = [];
        for (let record of records) {
            let metadataRecord = await $$.promisify(lightDBClient.getRecord)($$.SYSTEM_IDENTIFIER, record.pk, record.pk);
            let object = metadataRecord.data;
            let metadataObj = {};
            for (let key of object.metadata) {
                metadataObj[key] = object[key];
            }
            metadata.push(metadataObj);
        }
        return metadata;
    } catch (error) {
        throw error;
    }
}

async function addContainerObject(spaceId, objectType, objectData) {


    async function addContainerObjectToTable(lightDBEnclaveClient, objectType, objectData) {
        let objectId = `${objectType}_${crypto.generateId()}`;
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, objectType, objectId, {data: objectId});
        objectData.id = objectId;
        await insertObjectRecords(lightDBEnclaveClient, objectId, objectId, objectData);
        return objectId;
    }

    try {
        let lightDBClient = getLightDBClient(spaceId);
        return await addContainerObjectToTable(lightDBClient, objectType, objectData);
    } catch (error) {
        throw error;
    }
}

async function updateContainerObject(spaceId, objectId, objectData) {
    async function deleteContainerObjectTable(lightDBEnclaveClient, objectId) {
        let objectType = objectId.split('_')[0];
        await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, objectType, objectId);
        return objectId;
    }

    async function addContainerObjectToTable(lightDBEnclaveClient, objectType, objectData) {
        let objectId = `${objectType}_${crypto.generateId()}`;
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, objectType, objectId, {data: objectId});
        objectData.id = objectId;
        await insertObjectRecords(lightDBEnclaveClient, objectId, objectId, objectData);
        return objectId;
    }

    try {
        let lightDBClient = getLightDBClient(spaceId);
        await deleteContainerObjectTable(lightDBClient, objectId);
        let objectType = objectId.split('_')[0];
        await addContainerObjectToTable(lightDBClient, objectType, objectData);
        return objectId;
    } catch (error) {
        throw error
    }
}

async function deleteContainerObject(spaceId, objectId) {
    async function deleteContainerObjectTable(lightDBEnclaveClient, objectId) {
        let objectType = objectId.split('_')[0];
        await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, objectType, objectId);
        return objectId;
    }

    try {
        let lightDBClient = getLightDBClient(spaceId);
        await deleteContainerObjectTable(lightDBClient, objectId);
        return objectId;
    } catch (error) {
        throw error
    }
}

//Embedded Objects
async function insertEmbeddedObjectRecords(lightDBClient, tableId, objectURI, objectData, isUpdate = false) {
    let segments = objectURI.split("/");
    let pk = segments[0];
    segments = segments.slice(1);
    let record = await $$.promisify(lightDBClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, pk);
    let object = record.data;
    if (segments.length === 1) {
        let objectType = segments[0].split('_')[0];
        if (!object[objectType]) {
            object[objectType] = [];
        }
        if (!isUpdate) {
            //array concatenate
            if (Array.isArray(objectData)) {
                for (let item of objectData) {
                    if (!item.id) {
                        item.id = `${objectType}_${crypto.generateId()}`;
                    }
                    if (item.position) {
                        object[objectType].splice(item.position, 0, item.id);
                        delete item.position;
                    } else {
                        object[objectType].push(item.id);
                    }
                    await insertObjectRecords(lightDBClient, tableId, item.id, item);
                }
                await $$.promisify(lightDBClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: object});
                return objectData.map(item => item.id);
            }
            //single object
            if (!objectData.id) {
                objectData.id = `${objectType}_${crypto.generateId()}`;
            }
            if (objectData.position !== undefined) {
                object[objectType].splice(objectData.position, 0, objectData.id);
                delete objectData.position;
            } else {
                object[objectType].push(objectData.id);
            }
            await $$.promisify(lightDBClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: object});
        }
        await insertObjectRecords(lightDBClient, tableId, objectData.id, objectData);
        return objectData.id;
    } else {
        objectURI = segments.join("/");
        return await insertEmbeddedObjectRecords(lightDBClient, tableId, objectURI, objectData);
    }
}

async function getEmbeddedObject(spaceId, objectType, objectURI) {
    function isArrayOfEmbeddedObjectsRefs(object, objectType) {
        if (Array.isArray(object) && object.length !== 0) {
            if (typeof object[0] === "string") {
                if (object[0].includes("_")) {
                    if (object[0].split("_")[0] === objectType || object[0].split("_")[0].length <= 16) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    async function constructArrayOfEmbeddedObjects(lightDBClient, tableId, embeddedObjectRecord) {
        let array = [];
        for (let id of embeddedObjectRecord) {
            let record = await $$.promisify(lightDBClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, id);
            array.push(record.data);
        }
        return array;
    }

    async function constructEmbeddedObject(lightDBClient, tableId, record) {
        if (!record) {
            throw new Error(`No records found for this object`);
        }
        let object = record.data;
        for (let key of Object.keys(object)) {
            if (Array.isArray(object[key])) {
                for (let i = 0; i < object[key].length; i++) {
                    let record = await $$.promisify(lightDBClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, object[key][i]);
                    object[key][i] = await constructEmbeddedObject(lightDBClient, tableId, record);
                }
            }
        }
        return object;
    }

    try {
        const lightDBClient = getLightDBClient(spaceId);

        let [tableId, objectId, propertyName] = objectURI.split("/");
        if (!propertyName && !objectId.includes("_")) {
            propertyName = objectId;
            objectId = tableId;
        }
        let embeddedObjectRecord = await $$.promisify(lightDBClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
        let embeddedObject;
        if (propertyName) {
            if (isArrayOfEmbeddedObjectsRefs(embeddedObjectRecord.data[propertyName], propertyName)) {
                embeddedObject = await constructArrayOfEmbeddedObjects(lightDBClient, tableId, embeddedObjectRecord.data[propertyName]);
                return embeddedObject;
            } else {
                embeddedObject = embeddedObjectRecord.data[propertyName];
            }
        } else {
            embeddedObject = await constructEmbeddedObject(lightDBClient, tableId, embeddedObjectRecord);
        }
        return embeddedObject;
    } catch (error) {
        throw error;
    }
}

async function addEmbeddedObject(spaceId, objectType, objectURI, objectData) {

    try {
        let lightDBClient = getLightDBClient(spaceId);
        let parts = objectURI.split("/");
        let tableId = parts[0];
        return await insertEmbeddedObjectRecords(lightDBClient, tableId, objectURI, objectData);
    } catch (error) {
        throw error;
    }
}

async function updateEmbeddedObject(spaceId, objectURI, objectData, sessionId) {
    async function deleteEmbeddedObjectDependencies(lightDBClient, tableId, objectId) {
        let record = await $$.promisify(lightDBClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
        let object = record.data;
        for (let key of Object.keys(object)) {
            if (Array.isArray(object[key]) && object[key].length > 0) {
                if (typeof object[key][0] === "string" && object[key][0].includes("_")) {
                    for (let item of object[key]) {
                        await deleteEmbeddedObjectDependencies(lightDBClient, tableId, item);
                    }
                }
            }
        }
        await $$.promisify(lightDBClient.deleteRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
    }

    try {
        let lightDBClient = getLightDBClient(spaceId);
        let segments = objectURI.split("/");
        let [tableId, objectId, propertyName] = segments;
        if (!propertyName && !objectId.includes("_")) {
            propertyName = objectId;
            objectId = tableId;
        }
        if (propertyName) {
            let record = await $$.promisify(lightDBClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
            let object = record.data;
            if (Array.isArray(objectData) && objectData.length !== 0) {
                if (typeof objectData[0] === "object") {
                    for (let objectId of object[propertyName]) {
                        await deleteEmbeddedObjectDependencies(lightDBClient, tableId, objectId);
                    }
                    object[propertyName] = [];
                    for (let item of objectData) {
                        await insertEmbeddedObjectRecords(lightDBClient, tableId, objectURI, item, true);
                        object[propertyName].push(item.id);
                    }
                    await $$.promisify(lightDBClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: object});
                    return objectId;
                }
            }
            object[propertyName] = objectData;
            await $$.promisify(lightDBClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: object});
            if (segments.length === 3 || (segments.length === 2 && !Array.isArray(object[propertyName]))) {
                eventPublisher.notifyClients(sessionId, objectId, propertyName);
            } else {
                eventPublisher.notifyClients(sessionId, objectId);
            }
        } else {
            await deleteEmbeddedObjectDependencies(lightDBClient, tableId, objectId);
            await insertEmbeddedObjectRecords(lightDBClient, tableId, objectURI, objectData, true);
            eventPublisher.notifyClients(sessionId, objectId);
        }
        return objectId;
    } catch (error) {
        throw error
    }
}

async function deleteEmbeddedObject(spaceId, objectURI, sessionId) {
    async function deleteEmbeddedObjectFromTable(lightDBClient, tableId, objectURI) {
        async function deleteEmbeddedObjectDependencies(lightDBClient, tableId, objectId) {
            let record = await $$.promisify(lightDBClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
            let object = record.data;
            for (let key of Object.keys(object)) {
                if (Array.isArray(object[key]) && object[key].length > 0) {
                    if (typeof object[key][0] === "string" && object[key][0].includes("_")) {
                        for (let item of object[key]) {
                            await deleteEmbeddedObjectDependencies(lightDBClient, tableId, item);
                        }
                    }
                }
            }
            await $$.promisify(lightDBClient.deleteRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
        }

        let segments = objectURI.split("/");
        let pk = segments[0];
        segments = segments.slice(1);
        if (segments.length === 1) {
            let record = await $$.promisify(lightDBClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, pk);
            let object = record.data;
            let objectId = segments[0];
            let objectType = objectId.split('_')[0];
            if (object[objectType]) {
                object[objectType].splice(object[objectType].indexOf(objectId), 1)
                await $$.promisify(lightDBClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: object});
                await deleteEmbeddedObjectDependencies(lightDBClient, tableId, objectId);
                return objectId;
            }
        } else {
            objectURI = segments.join("/");
            return await deleteEmbeddedObjectFromTable(lightDBClient, tableId, objectURI);
        }
    }

    try {
        let lightDBEnclaveClient = getLightDBClient(spaceId);
        let parts = objectURI.split("/");
        let tableId = parts[0];
        await deleteEmbeddedObjectFromTable(lightDBEnclaveClient, tableId, objectURI);
        eventPublisher.notifyClients(sessionId, parts[parts.length - 2]);
        return objectURI;
    } catch (error) {
        throw error;
    }
}

async function swapEmbeddedObjects(spaceId, objectURI, embeddedIds, sessionId) {
    {

        try {
            let lightDBClient = getLightDBClient(spaceId);
            let [embeddedId1, embeddedId2] = Object.values(embeddedIds);
            let parts = objectURI.split("/");
            let [tableId, objectId, propertyName] = parts;
            if (!propertyName && !objectId.includes("_")) {
                propertyName = objectId;
                objectId = tableId;
            }
            let record = await $$.promisify(lightDBClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
            let object = record.data;
            let index1 = object[propertyName].indexOf(embeddedId1);
            let index2 = object[propertyName].indexOf(embeddedId2);
            if (index1 === -1 || index2 === -1) {
                throw (`Embedded objects not found in ${objectURI}`);
            }
            object[propertyName][index1] = embeddedId2;
            object[propertyName][index2] = embeddedId1;
            await $$.promisify(lightDBClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: object});
            eventPublisher.notifyClients(sessionId, objectId);
            return objectURI;
        } catch (error) {
            throw (error);
        }
    }
}
