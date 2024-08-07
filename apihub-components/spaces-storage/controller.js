require('../../assistos-sdk/build/bundles/assistos_sdk.js');
const utils = require('../apihub-component-utils/utils.js');
const cookie = require('../apihub-component-utils/cookie.js');
const space = require("./space.js");
const user = require("../users-storage/user.js");
const enclave = require("opendsu").loadAPI("enclave");
const crypto = require('../apihub-component-utils/crypto.js');
const fsPromises = require('fs').promises;
const path = require('path');
const eventPublisher = require("../subscribers/eventPublisher.js");
const {sendResponse} = require("../apihub-component-utils/utils");
const dataVolumePaths = require('../volumeManager').paths;
const ffmpeg = require('../apihub-component-utils/ffmpeg.js');
const Task = require('../apihub-component-utils/Task.js');
const TaskManager = require('../apihub-component-utils/TaskManager.js');
function getFileObjectsMetadataPath(spaceId, objectType) {
    return path.join(dataVolumePaths.space, `${spaceId}/${objectType}/metadata.json`);
}
const Busboy = require('busboy');
const unzipper= require('unzipper');
const { pipeline } = require('stream');
const util = require('util');
const pipelinePromise = util.promisify(pipeline);

async function getFileObjectsMetadata(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    try {
        let filePath = getFileObjectsMetadataPath(spaceId, objectType);
        let metadata = JSON.parse(await fsPromises.readFile(filePath, {encoding: 'utf8'}));
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: metadata,
            message: `Objects metadata of type ${objectType} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at getting objects metadata of type: ${objectType}`
        });
    }
}

function getFileObjectPath(spaceId, objectType, objectId) {
    return path.join(dataVolumePaths.space, `${spaceId}/${objectType}/${objectId}.json`);
}

async function getFileObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectId = request.params.objectId;
    try {
        let filePath = getFileObjectPath(spaceId, objectType, objectId);
        let data = await fsPromises.readFile(filePath, {encoding: 'utf8'});
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: JSON.parse(data),
            message: `Object with id: ${objectId} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at getting object with id: ${objectId}`
        });
    }
}

async function addFileObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectData = request.body;
    let objectId = crypto.generateId();
    try {
        objectData.id = objectId;
        let metaObj = {};
        for (let key of objectData.metadata) {
            metaObj[key] = objectData[key];
        }
        let metadataPath = getFileObjectsMetadataPath(spaceId, objectType);
        let metadata = JSON.parse(await fsPromises.readFile(metadataPath, {encoding: 'utf8'}));
        metadata.push(metaObj);
        await fsPromises.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

        let filePath = getFileObjectPath(spaceId, objectType, objectId);
        await fsPromises.writeFile(filePath, JSON.stringify(objectData, null, 2), 'utf8');
        eventPublisher.notifyClients(request.userId, request.sessionId, objectType);
        eventPublisher.notifyClients(request.userId, request.sessionId, objectId);

        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectId,
            message: `Object ${objectType} added successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at adding object: ${objectType}`
        });
    }
}

async function updateFileObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectId = request.params.objectId;
    const objectData = request.body;
    try {
        let filePath = getFileObjectPath(spaceId, objectType, objectId);
        let metadataPath = getFileObjectsMetadataPath(spaceId, objectType);
        let metadata = JSON.parse(await fsPromises.readFile(metadataPath, {encoding: 'utf8'}));
        let metaObj = metadata.find(item => item.id === objectId);
        if (metaObj) {
            for (let key of objectData.metadata) {
                metaObj[key] = objectData[key];
            }
            await fsPromises.writeFile(metadataPath, JSON.stringify(metadata), 'utf8');
        } else {
            return utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: `Error at updating object: ${objectId}: metadata not found`
            });
        }
        await fsPromises.writeFile(filePath, JSON.stringify(objectData, null, 2), 'utf8');
        eventPublisher.notifyClients(request.userId, request.sessionId, objectType);
        eventPublisher.notifyClients(request.userId, request.sessionId, objectId);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectId,
            message: `Object ${objectId} updated successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at updating object: ${objectId}`
        });
    }
}

async function deleteFileObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectId = request.params.objectId;
    try {
        let metadataPath = getFileObjectsMetadataPath(spaceId, objectType);
        let metadata = JSON.parse(await fsPromises.readFile(metadataPath, {encoding: 'utf8'}));
        let index = metadata.findIndex(item => item.id === objectId);
        if (index !== -1) {
            metadata.splice(index, 1);
            await fsPromises.writeFile(metadataPath, JSON.stringify(metadata), 'utf8');
        }
        let filePath = getFileObjectPath(spaceId, objectType, objectId);
        eventPublisher.notifyClients(request.userId, request.sessionId, objectType);
        eventPublisher.notifyClients(request.userId, request.sessionId, objectId, "delete");
        await fsPromises.unlink(filePath);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectId,
            message: `Object ${objectId} deleted successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at deleting object: ${objectId}`
        });
    }
}

async function getContainerObjectsMetadata(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    try {
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        let records = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, objectType);
        let metadata = [];
        for (let record of records) {
            let metadataRecord = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, record.pk, record.pk);
            let object = metadataRecord.data;
            let metadataObj = {};
            for (let key of object.metadata) {
                metadataObj[key] = object[key];
            }
            metadata.push(metadataObj);
        }
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: metadata,
            message: `Objects metadata of type ${objectType} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at getting objects metadata of type: ${objectType}`
        });
    }
}

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

function constructObject(recordsArray, objectId) {
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

async function getContainerObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectId = request.params.objectId;
    try {
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        let containerObjectRecords = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, objectId);
        if (containerObjectRecords.length === 0) {
            return utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: ` Error at getting object with id: ${objectId}`
            });
        }
        let object = constructObject(containerObjectRecords, objectId);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: object,
            message: `Object with id: ${objectId} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at getting object with id: ${objectId}`
        });
    }
}

async function insertObjectRecords(lightDBEnclaveClient, tableId, objectId, objectData) {
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
                        await insertObjectRecords(lightDBEnclaveClient, tableId, item.id, item);
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
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: object});
}

async function addContainerObjectToTable(lightDBEnclaveClient, objectType, objectData) {
    let objectId = `${objectType}_${crypto.generateId()}`;
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, objectType, objectId, {data: objectId});
    objectData.id = objectId;
    await insertObjectRecords(lightDBEnclaveClient, objectId, objectId, objectData);
    return objectId;
}

async function addContainerObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectData = request.body;
    try {
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        let objectId = await addContainerObjectToTable(lightDBEnclaveClient, objectType, objectData);
        eventPublisher.notifyClients(request.userId, request.sessionId, objectType);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectId,
            message: `Object ${objectType} added successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at adding object: ${objectType}`
        });
    }
}

async function updateContainerObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectId = request.params.objectId;
    const objectData = request.body;
    try {
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        await deleteContainerObjectTable(lightDBEnclaveClient, objectId);
        let objectType = objectId.split('_')[0];
        await addContainerObjectToTable(lightDBEnclaveClient, objectType, objectData);
        eventPublisher.notifyClients(request.userId, request.sessionId, objectType);
        eventPublisher.notifyClients(request.userId, request.sessionId, objectId);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectId,
            message: `Object ${objectId} updated successfully`
        });
    } catch (e) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: e + ` Error at updating object: ${objectId}`
        });
    }

}

async function deleteContainerObjectTable(lightDBEnclaveClient, objectId) {
    let objectType = objectId.split('_')[0];
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, objectType, objectId);
    return objectId;
}

async function deleteContainerObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectId = request.params.objectId;
    try {
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        await deleteContainerObjectTable(lightDBEnclaveClient, objectId);
        eventPublisher.notifyClients(request.userId, request.sessionId, objectId, "delete");
        eventPublisher.notifyClients(request.userId, request.sessionId, objectId.split('_')[0]);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectId,
            message: `Object ${objectId} deleted successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at deleting object: ${objectId}`
        });
    }
}

async function constructEmbeddedObject(lightDBEnclaveClient, tableId, record) {
    if (!record) {
        throw new Error(`No records found for this object`);
    }
    let object = record.data;
    for (let key of Object.keys(object)) {
        if (Array.isArray(object[key])) {
            for (let i = 0; i < object[key].length; i++) {
                let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, object[key][i]);
                object[key][i] = await constructEmbeddedObject(lightDBEnclaveClient, tableId, record);
            }
        }
    }
    return object;
}

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

async function constructArrayOfEmbeddedObjects(lightDBEnclaveClient, tableId, embeddedObjectRecord) {
    let array = [];
    for (let id of embeddedObjectRecord) {
        let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, id);
        array.push(record.data);
    }
    return array;
}

async function getEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    let objectURI = decodeURIComponent(request.params.objectURI);
    try {
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        let [tableId, objectId, propertyName] = objectURI.split("/");
        if (!propertyName && !objectId.includes("_")) {
            propertyName = objectId;
            objectId = tableId;
        }

        let embeddedObjectRecord = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
        let embeddedObject;
        if (propertyName) {
            if (isArrayOfEmbeddedObjectsRefs(embeddedObjectRecord.data[propertyName], propertyName)) {
                embeddedObject = await constructArrayOfEmbeddedObjects(lightDBEnclaveClient, tableId, embeddedObjectRecord.data[propertyName]);
                return utils.sendResponse(response, 200, "application/json", {
                    success: true,
                    data: embeddedObject,
                    message: `Object ${objectType} loaded successfully`
                });
            } else {
                embeddedObject = embeddedObjectRecord.data[propertyName];
            }
        } else {
            embeddedObject = await constructEmbeddedObject(lightDBEnclaveClient, tableId, embeddedObjectRecord);
        }
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: embeddedObject,
            message: `Object ${objectType} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at loading object: ${objectType}: ${objectURI}`
        });
    }
}

async function insertEmbeddedObjectRecords(lightDBEnclaveClient, tableId, objectURI, objectData, isUpdate = false) {
    let segments = objectURI.split("/");
    let pk = segments[0];
    segments = segments.slice(1);
    let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, pk);
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
                    await insertObjectRecords(lightDBEnclaveClient, tableId, item.id, item);
                }
                await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: object});
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
            await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: object});
        }
        await insertObjectRecords(lightDBEnclaveClient, tableId, objectData.id, objectData);
        return objectData.id;
    } else {
        objectURI = segments.join("/");
        return await insertEmbeddedObjectRecords(lightDBEnclaveClient, tableId, objectURI, objectData);
    }
}

async function addEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectURI = decodeURIComponent(request.params.objectURI);
    const objectData = request.body;
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    try {
        let parts = objectURI.split("/");
        let tableId = parts[0];
        let objectId = await insertEmbeddedObjectRecords(lightDBEnclaveClient, tableId, objectURI, objectData);
        eventPublisher.notifyClients(request.userId, request.sessionId, parts[parts.length - 2]);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectId,
            message: `Object ${objectId} added successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at adding object: ${objectURI}`
        });
    }
}

async function updateEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    let objectURI = decodeURIComponent(request.params.objectURI);
    const objectData = request.body;
    try {
        let segments = objectURI.split("/");
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        let [tableId, objectId, propertyName] = segments;
        if (!propertyName && !objectId.includes("_")) {
            propertyName = objectId;
            objectId = tableId;
        }
        if (propertyName) {
            let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
            let object = record.data;
            if (Array.isArray(objectData) && objectData.length !== 0) {
                if (typeof objectData[0] === "object") {
                    for (let objectId of object[propertyName]) {
                        await deleteEmbeddedObjectDependencies(lightDBEnclaveClient, tableId, objectId);
                    }
                    object[propertyName] = [];
                    for (let item of objectData) {
                        await insertEmbeddedObjectRecords(lightDBEnclaveClient, tableId, objectURI, item, true);
                        object[propertyName].push(item.id);
                    }
                    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: object});
                    eventPublisher.notifyClients(request.userId, request.sessionId, objectId, propertyName);
                    return utils.sendResponse(response, 200, "application/json", {
                        success: true,
                        data: objectId,
                        message: `Object ${objectId} updated successfully`
                    });
                }
            }
            object[propertyName] = objectData;
            await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: object});
            if (segments.length === 3 || (segments.length === 2 && !Array.isArray(object[propertyName]))) {
                eventPublisher.notifyClients(request.userId, request.sessionId, objectId, propertyName);
            } else {
                eventPublisher.notifyClients(request.userId, request.sessionId, objectId);
            }
        } else {
            await deleteEmbeddedObjectDependencies(lightDBEnclaveClient, tableId, objectId);
            await insertEmbeddedObjectRecords(lightDBEnclaveClient, tableId, objectURI, objectData, true);
            eventPublisher.notifyClients(request.userId, request.sessionId, objectId);
        }
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectId,
            message: `Object ${objectId} updated successfully`
        })
    } catch (e) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: e + ` Error at updating object: ${objectURI}`
        });
    }
}

async function deleteEmbeddedObjectDependencies(lightDBEnclaveClient, tableId, objectId) {
    let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
    let object = record.data;
    for (let key of Object.keys(object)) {
        if (Array.isArray(object[key]) && object[key].length > 0) {
            if (typeof object[key][0] === "string" && object[key][0].includes("_")) {
                for (let item of object[key]) {
                    await deleteEmbeddedObjectDependencies(lightDBEnclaveClient, tableId, item);
                }
            }
        }
    }
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
}

async function deleteEmbeddedObjectFromTable(lightDBEnclaveClient, tableId, objectURI) {
    let segments = objectURI.split("/");
    let pk = segments[0];
    segments = segments.slice(1);
    if (segments.length === 1) {
        let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, pk);
        let object = record.data;
        let objectId = segments[0];
        let objectType = objectId.split('_')[0];
        if (object[objectType]) {
            object[objectType].splice(object[objectType].indexOf(objectId), 1)
            await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: object});
            await deleteEmbeddedObjectDependencies(lightDBEnclaveClient, tableId, objectId);
            return objectId;
        }
    } else {
        objectURI = segments.join("/");
        return await deleteEmbeddedObjectFromTable(lightDBEnclaveClient, tableId, objectURI);
    }
}

async function deleteEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectURI = decodeURIComponent(request.params.objectURI);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    try {
        let parts = objectURI.split("/");
        let tableId = parts[0];
        await deleteEmbeddedObjectFromTable(lightDBEnclaveClient, tableId, objectURI);
        eventPublisher.notifyClients(request.userId, request.sessionId, parts[parts.length - 2]);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectURI,
            message: `Object ${objectURI} deleted successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at deleting object: ${objectURI}`
        });
    }
}

async function swapEmbeddedObjects(request, response) {
    const spaceId = request.params.spaceId;
    const objectURI = decodeURIComponent(request.params.objectURI);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let [embeddedId1, embeddedId2] = Object.values(request.body);
    try {
        let parts = objectURI.split("/");
        let [tableId, objectId, propertyName] = parts;
        if (!propertyName && !objectId.includes("_")) {
            propertyName = objectId;
            objectId = tableId;
        }
        let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
        let object = record.data;
        let index1 = object[propertyName].indexOf(embeddedId1);
        let index2 = object[propertyName].indexOf(embeddedId2);
        if (index1 === -1 || index2 === -1) {
            return utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: ` Error at swapping objects: ${objectURI}`
            });
        }
        object[propertyName][index1] = embeddedId2;
        object[propertyName][index2] = embeddedId1;
        await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: object});
        eventPublisher.notifyClients(request.userId, request.sessionId, objectId);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectURI,
            message: `Objects from ${objectURI} swapped successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at swapping objects: ${objectURI}`
        });
    }
}

async function addSpaceChatMessage(request, response) {
    const spaceId = request.params.spaceId;
    const chatId = request.params.chatId;
    const userId = request.userId;
    const messageData = request.body;
    try {
        const messageId = await space.APIs.addSpaceChatMessage(spaceId, chatId, userId, "user", messageData);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `Message added successfully`,
            data: {messageId: messageId}
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error
        });
    }
}

/* TODO constant object mapping of content types to avoid writing manually the content type of a response
*   and move the cookie verification authentication, rights, etc in a middleware */
async function getSpace(request, response) {
    try {
        let spaceId;
        const userId = request.userId;
        if (request.params.spaceId) {
            spaceId = request.params.spaceId;
        } else if (cookie.parseCookies(request).currentSpaceId) {
            spaceId = cookie.parseCookies(request).currentSpaceId;
        } else {
            spaceId = user.APIs.getDefaultSpaceId(userId);
        }

        let spaceObject = await space.APIs.getSpaceStatusObject(spaceId);
        spaceObject.chat = await space.APIs.getSpaceChat(spaceId);
        await user.APIs.updateUsersCurrentSpace(userId, spaceId);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: spaceObject,
            message: `Space ${spaceId} loaded successfully`
        }, cookie.createCurrentSpaceCookie(spaceId));
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error
        });
    }
}

async function createSpace(request, response) {
    const userId = request.userId
    const spaceName = request.body.spaceName
    if (!spaceName) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space Name is required",
            success: false
        });
        return;
    }
    try {
        let newSpace = await space.APIs.createSpace(spaceName, userId);
        utils.sendResponse(response, 201, "application/json", {
            message: `Space created successfully: ${newSpace.id}`,
            data: newSpace,
            success: true
        }, cookie.createCurrentSpaceCookie(newSpace.id));
    } catch (error) {
        switch (error.statusCode) {
            case 409:
                utils.sendResponse(response, 409, "application/json", {
                    message: "Conflict: Space already exists",
                    success: false
                });
                return;
            case 401:
                utils.sendResponse(response, 401, "application/json", {
                    message: "Unauthorized: Invalid API Key",
                    success: false
                });
                return;
        }
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
            success: false
        });
    }
}

async function addCollaboratorsToSpace(request, response) {
    /* TODO Check if the user has access to that space and has the right to add an user */
    const userId = request.userId;
    const spaceId = request.params.spaceId;
    if (!request.body.emails) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Collaborator Emails is required",
            success: false
        });
    }

    const collaboratorsEmails = request.body.emails;

    try {
        let collaborators = await user.APIs.inviteSpaceCollaborators(userId, spaceId, collaboratorsEmails);
        utils.sendResponse(response, 200, "application/json", {
            message: `Collaborators invited successfully`,
            success: true,
            data: collaborators
        });
    } catch (error) {
        switch (error.statusCode) {
            case 404:
                utils.sendResponse(response, 404, "application/json", {
                    message: "Not Found: Space not found",
                    success: false
                });
                return;
            case 409:
                utils.sendResponse(response, 409, "application/json", {
                    message: "Conflict: Collaborators already exists",
                    success: false
                });
                return;
        }
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
            success: false
        });
    }

}

async function getAgent(request, response) {
    let agentId = request.params.agentId;
    const spaceId = request.params.spaceId;
    const userId = request.userId;
    if (!agentId) {
        agentId = await user.APIs.getUserPrivateChatAgentId(userId, spaceId)
    }
    if (!agentId) {
        agentId = await space.APIs.getDefaultSpaceAgentId(spaceId)
    }
    try {
        const agent = await space.APIs.getSpaceAgent(spaceId, agentId)
        utils.sendResponse(response, 200, "application/json", {
            message: "Success retrieving Agent",
            success: true,
            data: agent
        })
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            message: "Error retrieving Agent",
            success: false,
            data: error.message
        })
    }
}

async function acceptSpaceInvitation(request, response) {
    const queryParams = utils.extractQueryParams(request);
    const invitationToken = queryParams.invitationToken;
    const newUser = queryParams.newUser || false;
    try {
        const HTMLResponse = await user.APIs.acceptSpaceInvitation(invitationToken, newUser);
        utils.sendResponse(response, 200, "text/html", HTMLResponse);
    } catch (error) {
        const spaceInvitationError = await user.APIs.getSpaceInvitationErrorHTML(error);
        utils.sendResponse(response, 500, "text/html", spaceInvitationError);
    }
}

async function rejectSpaceInvitation(request, response) {
    const queryParams = utils.extractQueryParams(request);
    const invitationToken = queryParams.invitationToken;
    try {
        const HTMLResponse = await user.APIs.rejectSpaceInvitation(invitationToken);
        utils.sendResponse(response, 200, "text/html", HTMLResponse);
    } catch (error) {
        const spaceInvitationError = await user.APIs.getSpaceInvitationErrorHTML(error);
        utils.sendResponse(response, 500, "text/html", spaceInvitationError);
    }
}

async function editAPIKey(request, response) {
    const spaceId = request.params.spaceId || cookie.parseCookies(request).currentSpaceId;
    if (!spaceId) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space ID or a valid currentSpaceId cookie is required",
            success: false
        });
    }
    if (!request.body.type || !request.body.APIKey) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Key Type and API Key are required in the request body",
            success: false
        });
    }
    const userId = request.userId;
    try {
        await space.APIs.editAPIKey(spaceId, userId, request.body);
        utils.sendResponse(response, 200, "application/json", {
            message: `API Key added successfully to space ${spaceId}`,
            success: true
        });
    } catch (error) {
        switch (error.statusCode) {
            case 400:
                utils.sendResponse(response, 400, "application/json", {
                    message: "Bad Request: Invalid Key Type",
                    success: false
                });
                return;
            case 404:
                utils.sendResponse(response, 404, "application/json", {
                    message: "Not Found: Space not found",
                    success: false
                });
                return;
            case 409:
                utils.sendResponse(response, 409, "application/json", {
                    message: "Conflict: API Key already exists",
                    success: false
                });
                return;
        }
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
            success: false
        });
    }
}

async function deleteAPIKey(request, response) {
    const spaceId = request.params.spaceId;
    const keyType = request.params.keyType;
    if (!spaceId) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space ID or a valid currentSpaceId cookie is required",
            success: false
        });
    }
    if (!keyType) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Key Type and Key Id are required in the request body",
            success: false
        });
    }
    try {
        await space.APIs.deleteAPIKey(spaceId, keyType);
        utils.sendResponse(response, 200, "application/json", {
            message: `API Key deleted successfully from space ${spaceId}`,
            success: true
        });
    } catch (error) {
        switch (error.statusCode) {
            case 404:
                utils.sendResponse(response, 404, "application/json", {
                    message: "Not Found: Space not found",
                    success: false
                });
                return;
            case 409:
                utils.sendResponse(response, 409, "application/json", {
                    message: "Conflict: API Key not found",
                    success: false
                });
                return;
        }
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
            success: false
        });
    }
}

async function getAPIKeysMetadata(request, response) {
    const spaceId = request.params.spaceId;
    try {
        let keys = await space.APIs.getAPIKeysMetadata(spaceId);
        return sendResponse(response, 200, "application/json", {
            success: true,
            data: keys,
        });
    } catch (e) {
        return sendResponse(response, 500, "application/json", {
            success: false,
            message: e
        });
    }
}

async function addSpaceAnnouncement(request, response) {
    const spaceId = request.params.spaceId;
    const announcementData = request.body;
    if (!announcementData.text || !announcementData.title) {
        utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Bad Request: title and text are required"
        })
    }
    try {
        const announcementId = await space.APIs.addSpaceAnnouncement(spaceId, announcementData);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `Announcement added successfully`,
            data: {announcementId: announcementId}
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error
        });
    }
}

async function getSpaceAnnouncement(request, response) {
    const spaceId = request.params.spaceId;
    const announcementId = request.params.announcementId;
    if (!announcementId) {
        utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Bad Request: announcementId is required"
        })
    }
    if (!spaceId) {
        utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Bad Request: spaceId is required"
        })
    }
    try {
        const announcement = await space.APIs.getSpaceAnnouncement(spaceId, announcementId);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `Announcement loaded successfully`,
            data: announcement
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function getSpaceAnnouncements(request, response) {
    const spaceId = request.params.spaceId;
    if (!spaceId) {
        utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Bad Request: spaceId is required"
        })
    }
    try {
        const announcements = await space.APIs.getSpaceAnnouncements(spaceId);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `Announcements loaded successfully`,
            data: announcements
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function updateSpaceAnnouncement(request, response) {
    const spaceId = request.params.spaceId;
    const announcementId = request.params.announcementId;
    const announcementData = request.body;
    if (!spaceId || !announcementId) {
        utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Bad Request: spaceId and announcementId are required"
        })
    }
    if (!announcementData.text || !announcementData.title) {
        utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Bad Request: title and text are required"
        })
    }
    try {
        await space.APIs.updateSpaceAnnouncement(spaceId, announcementId, announcementData);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `Announcement updated successfully`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function deleteSpaceAnnouncement(request, response) {
    const spaceId = request.params.spaceId;
    const announcementId = request.params.announcementId;
    if (!spaceId || !announcementId) {
        utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Bad Request: spaceId and announcementId are required"
        })
    }
    try {
        await space.APIs.deleteSpaceAnnouncement(spaceId, announcementId);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `Announcement deleted successfully`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}

const {
    getTextResponse,
    getTextStreamingResponse,
    getImageResponse,
    editImage,
    getImageVariants
} = require('../llms/controller.js');
const {APIs} = require("../../apihub-root/wallet/bundles/assistos_sdk");
const fs = require("fs");

async function getChatTextResponse(request, response) {

    const spaceId = request.params.spaceId;
    const chatId = request.params.chatId;
    const agentId = request.body.agentId
    const modelResponse = await getTextResponse(request, response);
    if (modelResponse.success) {
        const chatMessages = modelResponse.data.messages
        for (const chatMessage of chatMessages) {
            await space.APIs.addSpaceChatMessage(spaceId, chatId, agentId, "assistant", chatMessage);
        }
    }
}

async function getChatTextStreamingResponse(request, response) {
    const spaceId = request.params.spaceId;
    const chatId = request.params.chatId;
    const agentId = request.body.agentId;
    try {
        const modelResponse = await getTextStreamingResponse(request, response);
        if (modelResponse.success) {
            const chatMessages = modelResponse.data.messages;
            for (const chatMessage of chatMessages) {
                await space.APIs.addSpaceChatMessage(spaceId, chatId, agentId, "assistant", chatMessage);
            }
        }
    } catch (error) {
        console.error('Error in getChatTextStreamingResponse:', error);
    }
}


async function getChatImageResponse(request, response) {
}


async function editChatImage(request, response) {
}


async function getChatImageVariants(request, response) {
}

async function getChatVideoResponse(request, response) {

}

async function storeImage(request, response) {
    const spaceId = request.params.spaceId;
    const imageId = `${spaceId}_${crypto.generateId(8)}`;
    const objectData = request.body;
    try {
        await space.APIs.putImage(spaceId, imageId, objectData);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: imageId,
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at writing image: ${imageId}`
        });
    }

}

async function getImage(request, response) {
    const spaceId = request.params.spaceId;
    const imageId = request.params.imageId;
    try {
        let image = await space.APIs.getImage(spaceId, imageId);
        return utils.sendResponse(response, 200, "image/png", image);
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at reading image: ${imageId}`
        });
    }
}

async function deleteImage(request, response) {
    const spaceId = request.params.spaceId;
    const imageId = request.params.imageId;
    try {
        await space.APIs.deleteImage(spaceId, imageId);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: imageId,
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at reading image: ${imageId}`
        });
    }
}

async function storeAudio(request, response) {
    const spaceId = request.params.spaceId;
    const audioId = `${spaceId}_${crypto.generateId(8)}`;
    const objectData = request.body;
    try {
        await space.APIs.putAudio(spaceId, audioId, objectData);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: audioId,
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at writing audio: ${audioId}`
        });
    }
}

async function getAudio(request, response) {
    const spaceId = request.params.spaceId;
    const audioId = request.params.audioId;
    try {
        let audio = await space.APIs.getAudio(spaceId, audioId);
        return utils.sendResponse(response, 200, "audio/mpeg", audio);
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at reading audio: ${audioId}`
        });
    }
}

async function deleteAudio(request, response) {
    const spaceId = request.params.spaceId;
    const audioId = request.params.audioId;
    try {
        await space.APIs.deleteAudio(spaceId, audioId);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: audioId,
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at reading audio: ${audioId}`
        });
    }
}

async function compileVideoFromDocument(request, response) {
    let documentId = request.params.documentId;
    let spaceId = request.params.spaceId;
    let userId = request.userId;
    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    let task = new Task(async function () {
        await ffmpeg.documentToVideo(spaceId, document, userId, this);
    }, securityContext);
    TaskManager.addTask(task);
    sendResponse(response, 200, "application/json", {
        success: true,
        message: `Task in progress`,
        data: task.id
    });
    const documentModule = require("assistos").loadModule("document", securityContext);
    let document = await documentModule.getDocument(spaceId, documentId);
    try {
        await task.run();
        let videoPath = `/spaces/video/${spaceId}/${task.id}`;
        if (document.video) {
            const videoId = document.video.split("/").pop();
            try {
                await space.APIs.deleteVideo(spaceId, videoId);
            } catch (e) {
                //previous video not found
            }
        }
        await documentModule.updateVideo(spaceId, documentId, videoPath);
        eventPublisher.notifyClientTask(userId, task.id);
    } catch (error) {
        eventPublisher.notifyClientTask(userId, task.id, {error: error.message});
    }
}

async function cancelTask(request, response) {
    let taskId = request.params.taskId;
    try {
        TaskManager.cancelTaskAndRemove(taskId);
        sendResponse(response, 200, "application/json", {
            success: true,
            message: `Task ${taskId} cancelled`
        });
    } catch (error) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function getVideo(request, response) {
    const spaceId = request.params.spaceId;
    const videoId = request.params.videoId;
    try {
        let video = await space.APIs.getVideo(spaceId, videoId);
        return utils.sendResponse(response, 200, "video/mp4", video);
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at reading video: ${videoId}`
        });
    }
}

async function deleteVideo(request, response) {
    const spaceId = request.params.spaceId;
    const videoId = request.params.videoId;
    try {
        await space.APIs.deleteVideo(spaceId, videoId);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: videoId,
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at reading video: ${videoId}`
        });
    }
}


async function exportDocument(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;

    try {
        const archiveStream = await space.APIs.archiveDocument(spaceId, documentId);

        response.setHeader('Content-Disposition', `attachment; filename=${documentId}.docai`);
        response.setHeader('Content-Type', 'application/zip');

        archiveStream.pipe(response);

        archiveStream.on('end', () => {
            response.end();
        });

        archiveStream.on('error', err => {
            response.status(500).json({
                success: false,
                message: `Error at exporting document: ${documentId}. ${err.message}`
            });
        });
    } catch (error) {
        response.status(500).json({
            success: false,
            message: `Error at exporting document: ${documentId}. ${error.message}`
        });
    }
}

async function importDocument(request, response) {
    const spaceId = request.params.spaceId;
    const fileId = crypto.generateSecret(64);
    const tempDir = path.join(__dirname, '../../data-volume/Temp', fileId);
    const filePath = path.join(tempDir, `${fileId}.docai`);

    await fs.promises.mkdir(tempDir, { recursive: true });

    const busboy = Busboy({ headers: request.headers });

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const writeStream = fs.createWriteStream(filePath);
        file.pipe(writeStream);

        writeStream.on('finish', async () => {
            try {
                const extractedPath = path.join(tempDir, 'extracted');
                await fs.promises.mkdir(extractedPath, { recursive: true });

                await pipelinePromise(
                    fs.createReadStream(filePath),
                    unzipper.Extract({ path: extractedPath })
                );

                const extractedFiles = await fs.promises.readdir(extractedPath);

                if (!extractedFiles.includes('metadata.json') || !extractedFiles.includes('data.json')) {
                    throw new Error('metadata.json or data.json not found in the extracted files');
                }

                await space.APIs.importDocument(spaceId, extractedPath, request);

                fs.unlinkSync(filePath);

                utils.sendResponse(response, 200, "application/json", {
                    success: true,
                    message: 'Document imported successfully',
                });
            } catch (error) {
                console.error('Error processing extracted files:', error);
                utils.sendResponse(response, 500, "application/json", {
                    success: false,
                    message: `Error at importing document: ${error.message}`
                });
            } finally {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });

        writeStream.on('error', (error) => {
            console.error('Error writing file:', error);
            utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: `Error writing file: ${error.message}`
            });
        });
    });

    busboy.on('error', (error) => {
        console.error('Busboy error:', error);
        utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: `Busboy error: ${error.message}`
        });
    });

    request.pipe(busboy);
}


module.exports = {
    acceptSpaceInvitation,
    rejectSpaceInvitation,
    getFileObjectsMetadata,
    getFileObject,
    addFileObject,
    updateFileObject,
    deleteFileObject,
    getContainerObjectsMetadata,
    getContainerObject,
    addContainerObject,
    updateContainerObject,
    deleteContainerObject,
    getEmbeddedObject,
    addEmbeddedObject,
    updateEmbeddedObject,
    swapEmbeddedObjects,
    deleteEmbeddedObject,
    getSpace,
    addSpaceChatMessage,
    createSpace,
    addCollaboratorsToSpace,
    getAgent,
    editAPIKey,
    deleteAPIKey,
    getAPIKeysMetadata,
    addSpaceAnnouncement,
    getSpaceAnnouncement,
    getSpaceAnnouncements,
    updateSpaceAnnouncement,
    deleteSpaceAnnouncement,
    getChatTextResponse,
    getChatTextStreamingResponse,
    getChatImageResponse,
    editChatImage,
    getChatImageVariants,
    getChatVideoResponse,
    storeImage,
    getImage,
    deleteImage,
    storeAudio,
    deleteAudio,
    getAudio,
    getVideo,
    deleteVideo,
    compileVideoFromDocument,
    exportDocument,
    importDocument,
    cancelTask,
}