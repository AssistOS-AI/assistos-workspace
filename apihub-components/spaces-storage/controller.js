const utils = require('../apihub-component-utils/utils.js');
// const cookie = require('../apihub-component-utils/cookie.js');
// const Loader = require('../../assistOS-sdk');
const {constants} = require("../../assistos-sdk");
// const userModule = Loader.loadModule('user');
// const spaceModule = Loader.loadModule('space');
// const spaceAPIs = spaceModule.loadAPIs();
const enclave = require("opendsu").loadAPI("enclave");

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
    const objectsToRemove = recordsArray.filter(record => record.pk.includes(arraySubtype));
    const dataArray = objectsToRemove.map(record => record.data);
    objectsToRemove.forEach(object => {
        const index = recordsArray.indexOf(object);
        if (index !== -1) {
            recordsArray.splice(index, 1);
        }
    });
    return dataArray;
}

function constructArrayOfObjects(schemaArrayType, arrayItemsSchema, recordsArray, nestingLevel) {
    let arrayOfObjects = [];
    let objectRecords = recordsArray.filter(record => record.pk.includes(`#${schemaArrayType}#`));
    //remove records from original array
    objectRecords.forEach(object => {
        const index = recordsArray.indexOf(object);
        if (index !== -1) {
            recordsArray.splice(index, 1);
        }
    });
    const groupedObjectRecords = objectRecords.reduce((groups, record) => {
        //different objectIds in array
        const objectId = record.pk.split('#')[nestingLevel * 2];
        if (!groups[objectId]) {
            groups[objectId] = [];
        }
        groups[objectId].push(record);
        return groups;
    }, {});

    for (let key of Object.keys(groupedObjectRecords)) {
        let objectItem = {
            id: key,
        }
        for (let key of Object.keys(arrayItemsSchema)) {
            if (typeof arrayItemsSchema[key] === "object") {
                if (arrayItemsSchema[key].type === "array") {
                    objectItem[key] = constructArrayOfObjects(key, arrayItemsSchema[key], recordsArray, nestingLevel + 1);
                } else {
                    //TODO: handle object embedded type
                }
            } else if (arrayItemsSchema[key] === "string" || arrayItemsSchema[key] === "number") {
                objectItem[key] = getRecordDataAndRemove(recordsArray, key);
            } else if (arrayItemsSchema[key] === "array") {
                objectItem[key] = constructArrayAndRemove(recordsArray, key);
            }
        }
        arrayOfObjects.push(objectItem);
    }
    if (arrayItemsSchema["position"]) {
        arrayOfObjects.sort((a, b) => a.position - b.position);
    }
    return arrayOfObjects;
}

function constructContainerObject(objectType, objectId, recordsArray) {
    if (!recordsArray || recordsArray.length === 0) {
        throw new Error(`No records found for container object with id: ${objectId}`);
    }
    try {
        let containerObject = {
            id: objectId,
        }
        const nestingLevel = 0;
        let schema = constants.OBJECT_SCHEMAS[objectType];
        for (let key of Object.keys(schema)) {
            if (typeof schema[key] === "object") {
                if (schema[key].type === "array") {
                    containerObject[key] = constructArrayOfObjects(key, schema[key].items, recordsArray, nestingLevel + 1);
                } else {
                    //TODO: handle object embedded type
                }
            } else if (schema[key] === "string" || schema[key] === "number") {
                containerObject[key] = getRecordDataAndRemove(recordsArray, key);
            } else if (schema[key] === "array") {
                containerObject[key] = constructArrayAndRemove(recordsArray, key);
            }
        }
        return containerObject;


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
        let object = constructContainerObject(objectType, objectId, containerObjectRecords);
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
    return `${objectType}/${pkSuffix}`;
}
function getArrayItemPk(objectType, pkSuffix, objectId) {
    return `${objectType}/${pkSuffix}/${objectId}`;
}
function iterateObjectAndInsertRecords(lightDBEnclaveClient, tableId, schema, data, pkSuffix) {
    for (let key of Object.keys(schema)) {
        if (typeof schema[key] === "object") {
            if (schema[key].type === "array") {
                if (data[key] && Array.isArray(data[key])) {
                    for (let item of data[key]) {
                        iterateObjectAndInsertRecords(lightDBEnclaveClient, tableId, schema[key].items, item, pkSuffix + `${key}/${item.id}`);
                    }
                }
            } else {
                //TODO: handle object embedded type
            }
        } else if (schema[key] === "string" || schema[key] === "number") {
            if (data[key]) {
                let pk = getObjectPk(key, pkSuffix);
                lightDBEnclaveClient.insertRecord($$.SYSTEM_IDENTIFIER, tableId, pk, {data: data[key]});
            }
        } else if (schema[key] === "array") {
            if (data[key] && Array.isArray(data[key])) {
                for (let item of data[key]) {
                    let pk = getArrayItemPk(key, pkSuffix, item.id);
                    lightDBEnclaveClient.insertRecord($$.SYSTEM_IDENTIFIER, tableId, pk, {data: item});
                }
            }
        }
    }
}

async function addContainerObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectData = request.body;

    // let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    // await $$.promisify(lightDBEnclaveClient.createDatabase)(spaceId);
    // await $$.promisify(lightDBEnclaveClient.grantWriteAccess)($$.SYSTEM_IDENTIFIER);

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

        await deleteContainerObjectTable(spaceId, objectId, objectData);
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
    const objectURI = request.params.objectURI;
    try {
        if (!constants.OBJECT_SCHEMAS[objectType]) {
            return utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: `Invalid container object type: ${objectType}`
            });
        }
        let embeddedObject;
        let objectSchema = getEmbeddedObjectSchema(objectType, objectURI, constants.OBJECT_SCHEMAS);
        let tableId = getContainerObjectId(objectURI);
        let pk = getObjectPk(objectType, objectURI);
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        if(typeof objectSchema === "object"){
            if(objectSchema.type === "array"){
                let query = [`pk like ${pk}`];
                let records = await $$.promisify(lightDBEnclaveClient.filter)($$.SYSTEM_IDENTIFIER, tableId, query);
                embeddedObject = constructArrayOfObjects(objectType, objectSchema.items, records, 0);
            } else {
                //TODO: handle object embedded type
            }
        } else if(objectSchema === "array"){
            let query = [`pk like ${pk}`];
            let records = await $$.promisify(lightDBEnclaveClient.filter)($$.SYSTEM_IDENTIFIER, tableId, query);
            embeddedObject = records.map(record => record.data);
        } else if(objectSchema === "string" || objectSchema === "number"){
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

async function addEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectURI = request.params.objectURI;
    const objectData = request.body;
    try {
        let objectSchema = getEmbeddedObjectSchema(objectType, objectURI, constants.OBJECT_SCHEMAS);
        let tableId = getContainerObjectId(objectURI);
        let pk = getObjectPk(objectType, objectURI);
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        await iterateObjectAndInsertRecords(lightDBEnclaveClient, tableId, objectSchema, objectData, pk);
        let object = await spaceAPIs.addEmbeddedObject(spaceId, objectType, objectURI, objectData);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: object,
            message: `Object ${objectType} added successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at adding object: ${objectType} at ${objectURI}`
        });
    }
}

async function updateEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectURI = request.params.objectURI;
    const objectData = request.body;
    try {
        let object = await spaceAPIs.updateEmbeddedObject(spaceId, objectType, objectURI, objectData);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: object,
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
    const objectURI = request.params.objectURI;
    try {
        let objectId = await spaceAPIs.deleteEmbeddedObject(spaceId, objectType, objectURI);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectId,
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