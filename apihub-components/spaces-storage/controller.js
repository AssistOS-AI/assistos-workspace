const utils = require('../apihub-component-utils/utils.js');
// const cookie = require('../apihub-component-utils/cookie.js');
// const Loader = require('../../assistOS-sdk');
const assistOS = require('assistos-sdk');
const constants = assistOS.constants;
// const userModule = Loader.loadModule('user');
// const spaceModule = Loader.loadModule('space');
// const spaceAPIs = spaceModule.loadAPIs();
const enclave = require("opendsu").loadAPI("enclave");
const crypto = assistOS.loadModule("util").loadAPIs("crypto");
async function getFileObject() {

}

async function addFileObject(request, response) {

}

async function updateFileObject(request, response) {

}

async function deleteFileObject(request, response) {

}

function getRecordDataAndRemove(recordsArray, pk) {
    const index = recordsArray.findIndex(item => item.pk === pk);
    if (index !== -1) {
        const record = recordsArray[index];
        recordsArray.splice(index, 1);
        return record.data;
    } else {
        return null;
    }
}

function constructArrayAndRemove(recordsArray, arraySubtype) {
    const objectsToRemove = recordsArray.filter(record => record.pk.includes(arraySubtype) && record.pk.split('/').length === arraySubtype.split('/').length + 1);
    const dataArray = objectsToRemove.map(record => record.data);
    objectsToRemove.forEach(object => {
        const index = recordsArray.indexOf(object);
        if (index !== -1) {
            recordsArray.splice(index, 1);
        }
    });
    return dataArray;
}

function constructArrayOfObjects(pkSuffix, arrayItemsSchema, recordsArray, nestingLevel) {
    let arrayOfObjects = [];
    let objectRecords = recordsArray.filter(record => record.pk.includes(`/${pkSuffix}/`));
    //remove records from original array
    objectRecords.forEach(object => {
        const index = recordsArray.indexOf(object);
        if (index !== -1) {
            recordsArray.splice(index, 1);
        }
    });
    const groupedObjectRecords = objectRecords.reduce((groups, record) => {
        //different objectIds in array
        const objectId = record.pk.split('/')[nestingLevel * 2];
        if (!groups[objectId]) {
            groups[objectId] = [];
        }
        groups[objectId].push(record);
        return groups;
    }, {});

    for (let objectId of Object.keys(groupedObjectRecords)) {
        let objectItem = {
            id: objectId,
        }
        for (let key of Object.keys(arrayItemsSchema)) {
            if (typeof arrayItemsSchema[key] === "object") {
                if (arrayItemsSchema[key].type === "array") {
                    objectItem[key] = constructArrayOfObjects(pkSuffix +`/${objectId}/${key}`, arrayItemsSchema[key].items, groupedObjectRecords[objectId], nestingLevel + 1);
                } else {
                    //TODO: handle object embedded type
                }
            } else if (arrayItemsSchema[key] === "string" || arrayItemsSchema[key] === "number") {
                let pk = `${key}/${pkSuffix}/${objectId}`;
                objectItem[key] = getRecordDataAndRemove(groupedObjectRecords[objectId], pk) || "";
            } else if (arrayItemsSchema[key] === "array") {
                let pk = `${key}/${pkSuffix}/${objectId}`;
                objectItem[key] = constructArrayAndRemove(groupedObjectRecords[objectId], pk);
            }
        }
        arrayOfObjects.push(objectItem);
    }
    if (arrayItemsSchema["position"]) {
        arrayOfObjects.sort((a, b) => a.position - b.position);
    }
    return arrayOfObjects;
}
function constructObject(objectType, schema, objectId, recordsArray, embeddedObjPkSuffix) {
    if (!recordsArray || recordsArray.length === 0) {
        throw new Error(`No records found for container object with id: ${objectId}`);
    }
    try {
        let object = {
            id: objectId,
        }
        const nestingLevel = 0;
        for (let key of Object.keys(schema)) {
            if (typeof schema[key] === "object") {
                if (schema[key].type === "array") {
                    let pkSuffix = key;
                    if(embeddedObjPkSuffix){
                        pkSuffix = `${embeddedObjPkSuffix}/${key}`;
                    }
                    object[key] = constructArrayOfObjects(pkSuffix, schema[key].items, recordsArray, nestingLevel + 1);
                } else {
                    //TODO: handle object embedded type
                }
            } else if (schema[key] === "string" || schema[key] === "number") {
                object[key] = getRecordDataAndRemove(recordsArray, key) || "";
            } else if (schema[key] === "array") {
                object[key] = constructArrayAndRemove(recordsArray, key);
            }
        }
        return object;
    } catch (e) {
        throw new Error(`Error constructing container Object with id ${objectId}: ${e}`);
    }
}

async function getContainerObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectId = request.params.objectId;
    try {
        if (!constants.OBJECT_SCHEMAS[objectType]) {
            return utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: `Invalid container object type: ${objectType}`
            });
        }
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        let containerObjectRecords = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, objectId);
        let object = constructObject(objectType, constants.OBJECT_SCHEMAS[objectType], objectId, containerObjectRecords);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: object,
            message: `Object ${objectType} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at getting object: ${objectType}: ${objectId}`
        });
    }
}

async function insertContainerObjectRecords(spaceId, objectType, objectData, isUpdate = false) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let containerObjectId;
    if (isUpdate) {
        containerObjectId = objectData.id;
    } else {
        containerObjectId = crypto.generateId();
    }
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, objectType, containerObjectId, {data: containerObjectId});
    await iterateObjectAndInsertRecords(lightDBEnclaveClient, containerObjectId, constants.OBJECT_SCHEMAS[objectType], objectData, "")
    return containerObjectId;
}
function getObjectPk(objectType, pkSuffix) {
    if(!pkSuffix){
        return objectType;
    }
    return `${objectType}/${pkSuffix}`;
}
function getArrayItemPk(objectType, pkSuffix, objectId) {
    return `${objectType}/${pkSuffix}/${objectId}`;
}
async function iterateObjectAndInsertRecords(lightDBEnclaveClient, tableId, schema, data, pkSuffix) {
    for (let key of Object.keys(schema)) {
        if (typeof schema[key] === "object") {
            if (schema[key].type === "array") {
                if (data[key] && Array.isArray(data[key])) {
                    for (let item of data[key]) {
                        await iterateObjectAndInsertRecords(lightDBEnclaveClient, tableId, schema[key].items, item, pkSuffix + `${key}/${item.id}/`);
                    }
                }
            } else {
                //TODO: handle object embedded type
            }
        } else if (schema[key] === "string" || schema[key] === "number") {
            if (data[key]) {
                let tempPkSuffix = pkSuffix;
                if(tempPkSuffix.endsWith("/")){
                    tempPkSuffix = tempPkSuffix.slice(0, -1);
                }
                let pk = getObjectPk(key, tempPkSuffix);
                await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: data[key]})

            }
        } else if (schema[key] === "array") {
            if (data[key] && Array.isArray(data[key])) {
                let tempPkSuffix = pkSuffix;
                if(tempPkSuffix.endsWith("/")){
                    tempPkSuffix = tempPkSuffix.slice(0, -1);
                }
                for (let item of data[key]) {
                    let pk = getArrayItemPk(key, tempPkSuffix, item.id);
                    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: item})
                }
            }
        }
    }
}

async function addContainerObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectData = request.body;
    try {
        if (!constants.OBJECT_SCHEMAS[objectType]) {
            return utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: `Invalid container object type: ${objectType}`
            });
        }
        let object = await insertContainerObjectRecords(spaceId, objectType, objectData);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: object,
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
    const objectType = request.params.objectType;
    const objectId = request.params.objectId;
    const objectData = request.body;
    try {
        if (!constants.OBJECT_SCHEMAS[objectType]) {
            return utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: `Invalid container object type: ${objectType}`
            });
        }

        await deleteContainerObjectTable(spaceId, objectType, objectId);
        await insertContainerObjectRecords(spaceId, objectType, objectData, true);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectId,
            message: `Object ${objectType} updated successfully`
        });
    } catch (e) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: e + ` Error at updating object: ${objectType}: ${objectId}`
        });
    }

}

async function deleteContainerObjectTable(spaceId, objectType, objectId) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, objectType, objectId);
    return objectId;
}

async function deleteContainerObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectId = request.params.objectId;
    try {
        if (!constants.OBJECT_SCHEMAS[objectType]) {
            return utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: `Invalid container object type: ${objectType}`
            });
        }
        await deleteContainerObjectTable(spaceId, objectType, objectId);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectId,
            message: `Object ${objectType} ${objectId} deleted successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at deleting object: ${objectType}: ${objectId}`
        });
    }
}

function getEmbeddedObjectSchema(objectType, objectURI, schema) {
    objectURI += `/${objectType}`;
    let splitURI = objectURI.split("/");
    let componentNames = splitURI.filter((element, index) => index % 2 === 0);
    for (let name of componentNames) {
        if (name === objectType) {
            if(schema.hasOwnProperty(objectType)){
                return schema[objectType];
            } else {
                throw new Error(`Invalid object URI: ${objectURI}, type: ${objectType}`);
            }

        }
        if (!schema[name]) {
            throw new Error(`Invalid object URI: ${objectURI}, type: ${objectType}`);
        }
        schema = schema[name];
        if (schema["type"]) {
            if (schema["type"] === "array") {
                schema = schema["items"];
            } else if (schema["type"] === "object") {
                schema = schema["properties"];
            }
        }
    }
    throw new Error(`Invalid object URI: ${objectURI}, type: ${objectType}`);
}
function getContainerObjectId(objectURI){
    return objectURI.split("/")[1];
}
async function getEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    //decode it first decodeURIComponent
    const objectURI = decodeURIComponent(request.params.objectURI);
    try {
        let embeddedObject;
        let objectSchema = getEmbeddedObjectSchema(objectType, objectURI, constants.OBJECT_SCHEMAS);
        let tableId = getContainerObjectId(objectURI);
        let pkSuffix = getEmbeddedObjectPkSuffix(objectURI);
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        if(typeof objectSchema === "object"){
            if(objectSchema.type === "array"){
                let query = [`pk like /${pkSuffix}`];
                let segments = objectURI.split("/");
                let objectId = segments[segments.length - 1];
                let records = await $$.promisify(lightDBEnclaveClient.filter)($$.SYSTEM_IDENTIFIER, tableId, query);
                embeddedObject = constructObject(objectType, objectSchema.items, objectId, records, pkSuffix);
            } else {
                //TODO: handle object embedded type
            }
        } else if(objectSchema === "array"){
            let pk = getObjectPk(objectType, pkSuffix);
            let query = [`pk like ${pk}`];
            let records = await $$.promisify(lightDBEnclaveClient.filter)($$.SYSTEM_IDENTIFIER, tableId, query);
            embeddedObject = records.map(record => record.data);
        } else if(objectSchema === "string" || objectSchema === "number"){
            let pk = getObjectPk(objectType, pkSuffix);
            let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, pk);
            embeddedObject = record.data;
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
function getEmbeddedObjectPkSuffix(objectURI){
    return objectURI.split("/").slice(2).join("/");
}
async function addEmbeddedObject(request, response, isUpdate = false) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectURI = decodeURIComponent(request.params.objectURI);
    const objectData = request.body;
    try {
        let objectSchema = getEmbeddedObjectSchema(objectType, objectURI, constants.OBJECT_SCHEMAS);
        let tableId = getContainerObjectId(objectURI);
        let pkSuffix = getEmbeddedObjectPkSuffix(objectURI);
        if(pkSuffix){
            pkSuffix += "/";
        }
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        if (typeof objectSchema === "object") {
            if (objectSchema.type === "array") {
                let newObjectId;
                if(isUpdate){
                    newObjectId = objectData.id;
                } else {
                    newObjectId = crypto.generateId();
                }
                await iterateObjectAndInsertRecords(lightDBEnclaveClient, tableId, objectSchema.items, objectData, pkSuffix + `${objectType}/${newObjectId}/`);
            } else {
                //TODO: handle object embedded type
            }
        } else if (objectSchema === "string" || objectSchema === "number") {
            let pk = getObjectPk(objectType, pkSuffix);
            await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: objectData});
        } else if (objectSchema === "array") {
            let newObjectId = crypto.generateId();
            let pk = getArrayItemPk(objectType, pkSuffix, newObjectId);
            await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: objectData});
        }
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectURI,
            message: `Object ${objectType} added successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at adding object: ${objectType} at ${objectURI}`
        });
    }
}
async function iterateObjectAndUpdateRecords(lightDBEnclaveClient, tableId, schema, data, pkSuffix) {
    for (let key of Object.keys(schema)) {
        if (typeof schema[key] === "object") {
            if (schema[key].type === "array") {
                if (data[key] && Array.isArray(data[key])) {
                    for (let item of data[key]) {
                        await iterateObjectAndUpdateRecords(lightDBEnclaveClient, tableId, schema[key].items, item, pkSuffix + `${key}/${item.id}/`);
                    }
                }
            } else {
                //TODO: handle object embedded type
            }
        } else if (schema[key] === "string" || schema[key] === "number") {
            if (data[key]) {
                let tempPkSuffix = pkSuffix;
                if(tempPkSuffix.endsWith("/")){
                    tempPkSuffix = tempPkSuffix.slice(0, -1);
                }
                let pk = getObjectPk(key, tempPkSuffix);
                await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: data[key]})

            }
        } else if (schema[key] === "array") {
            if (data[key] && Array.isArray(data[key])) {
                let tempPkSuffix = pkSuffix;
                if(tempPkSuffix.endsWith("/")){
                    tempPkSuffix = tempPkSuffix.slice(0, -1);
                }
                for (let item of data[key]) {
                    let pk = getArrayItemPk(key, tempPkSuffix, item.id);
                    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: item})
                }
            }
        }
    }
}
async function updateEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectURI = decodeURIComponent(request.params.objectURI);
    const objectData = request.body;
    try {
        let objectSchema = getEmbeddedObjectSchema(objectType, objectURI, constants.OBJECT_SCHEMAS);
        let tableId = getContainerObjectId(objectURI);
        let pkSuffix = getEmbeddedObjectPkSuffix(objectURI);
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        if (typeof objectSchema === "object") {
            if (objectSchema.type === "array") {
                //error here it sends response multiple times
                await deleteEmbeddedObject(request, response);
                await addEmbeddedObject(request, response, true);
            } else {
                //TODO: handle object embedded type
            }
        } else if (objectSchema === "string" || objectSchema === "number") {
            let pk = getObjectPk(objectType, pkSuffix);
            await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: objectData});
        } else if (objectSchema === "array") {
            let newObjectId = crypto.generateId();
            let pk = getArrayItemPk(objectType, pkSuffix, newObjectId);
            await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: objectData});
        }
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectURI,
            message: `Object ${objectType} updated successfully`
        })
    } catch (e) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: e + ` Error at updating object: ${objectType} at ${objectURI}`
        });
    }
}

async function deleteEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectURI = decodeURIComponent(request.params.objectURI);
    try {
        let objectSchema = getEmbeddedObjectSchema(objectType, objectURI, constants.OBJECT_SCHEMAS);
        let tableId = getContainerObjectId(objectURI);
        let pkSuffix = getEmbeddedObjectPkSuffix(objectURI);
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        if(typeof objectSchema === "object"){
            if(objectSchema.type === "array"){
                let query = [`pk like /${pkSuffix}`];
                let records = await $$.promisify(lightDBEnclaveClient.filter)($$.SYSTEM_IDENTIFIER, tableId, query);
                for(let record of records){
                    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, tableId, record.pk);
                }
            } else {
                //TODO: handle object embedded type
            }
        } else if(objectSchema === "array"){
            let pk = getObjectPk(objectType, pkSuffix);
            let query = [`pk like ${pk}`];
            let records = await $$.promisify(lightDBEnclaveClient.filter)($$.SYSTEM_IDENTIFIER, tableId, query);
            for(let record of records){
                await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, tableId, record.pk);
            }
        } else if(objectSchema === "string" || objectSchema === "number"){
            let pk = getObjectPk(objectType, pkSuffix);
            await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, tableId, pk);
        }
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: decodeURIComponent(request.params.objectURI),
            message: `Object ${objectType} deleted successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at deleting object: ${objectType} at ${objectURI}`
        });
    }
}

async function loadObject(request, response) {

    const filePath = `../data-volume/spaces/${request.params.spaceId}/${request.params.objectType}/${request.params.objectName}.json`;
    let data;
    try {
        data = await fsPromises.readFile(filePath, {encoding: 'utf8'});
    } catch (error) {
        sendResponse(response, 404, "text/html", error + ` Error space not found: ${filePath}`);
        return;
    }
    sendResponse(response, 200, "text/html", data);
}

async function storeObject(request, response) {

    const filePath = `../data-volume/spaces/${request.params.spaceId}/${request.params.objectType}/${request.params.objectName}.json`;
    if (!request.body || Object.keys(request.body).length === 0) {
        try {
            await fsPromises.unlink(filePath);
            sendResponse(response, 200, "text/html", `Deleted successfully ${request.params.objectName}`);
        } catch (error) {
            sendResponse(response, 500, "text/html", `Error deleting ${request.params.objectName}`);
        }
        return;
    }
    try {
        const jsonData = request.body;
        await fsPromises.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
        sendResponse(response, 200, "text/html", `Success, saved ${request.params.objectName}`);
    } catch (error) {
        sendResponse(response, 500, "text/html", `Error saving ${request.params.objectName}`);
    }
}

/* TODO constant object mapping of content types to avoid writing manually the content type of a response
*   and move the cookie verification authentication, rights, etc in a middleware */
async function getSpace(request, response) {
    const userAPIs = userModule.loadAPIs();
    const spaceAPIs = spaceModule.loadAPIs();
    try {
        let spaceId;
        const userId = request.userId;
        if (request.params.spaceId) {
            spaceId = request.params.spaceId;
        } else if (cookie.parseCookies(request).currentSpaceId) {
            spaceId = cookie.parseCookies(request).currentSpaceId;
        } else {
            spaceId = userAPIs.getDefaultSpaceId(userId);
        }

        let spaceObject = await spaceAPIs.getSpaceStatusObject(spaceId);
        spaceObject["documents"] = await spaceAPIs.getSpaceDocumentsObject(spaceId);
        spaceObject["personalities"] = await spaceAPIs.getSpacePersonalitiesObject(spaceId);
        await userAPIs.updateUsersCurrentSpace(userId, spaceId);
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
    const spaceAPIs = spaceModule.loadAPIs();

    const spaceName = request.body.spaceName
    if (!spaceName) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space Name is required",
            success: false
        });
        return;
    }

    const apiKey = request.headers.apikey;
    if (!apiKey) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: API Key is required",
            success: false
        });
        return;
    }

    try {
        let newSpace = await spaceAPIs.createSpace(spaceName, userId, apiKey);
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

async function addCollaboratorToSpace(request, response) {
    /* Todo Check if the user has access to that space and has the right to add an user */
    const userId = request.userId
    const userAPIs = userModule.loadAPIs();

    const spaceId = request.body.spaceId;
    if (!spaceId) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space Id is required",
            success: false
        });
        return;
    }
    const collaboratorId = request.body.collaboratorId;
    if (!collaboratorId) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Collaborator Id is required",
            success: false
        });
        return;
    }

    try {
        await userAPIs.addSpaceCollaborator(spaceId, collaboratorId);
        utils.sendResponse(response, 200, "application/json", {
            message: `Collaborator added successfully: ${collaboratorId}`,
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
                    message: "Conflict: Collaborator already exists",
                    success: false
                });
                return;
            case 401:
                utils.sendResponse(response, 401, "application/json", {
                    message: "Unauthorized: Invalid Collaborator Id",
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


module.exports = {
    getFileObject,
    addFileObject,
    updateFileObject,
    deleteFileObject,
    getContainerObject,
    addContainerObject,
    updateContainerObject,
    deleteContainerObject,
    getEmbeddedObject,
    addEmbeddedObject,
    updateEmbeddedObject,
    deleteEmbeddedObject,
    getSpace,
    createSpace,
    addCollaboratorToSpace
}