const utils = require('../apihub-component-utils/utils.js');
// const cookie = require('../apihub-component-utils/cookie.js');
require('../../assistos-sdk/build/bundles/assistOS.js');
const enclave = require("opendsu").loadAPI("enclave");
const crypto = require('../apihub-component-utils/crypto.js');
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
function constructObject(recordsArray, objectId) {
    if (!recordsArray || recordsArray.length === 0) {
        throw new Error(`No records found for this object`);
    }
    let object = getRecordDataAndRemove(recordsArray, objectId);
    for (let key of Object.keys(object)) {
        if (Array.isArray(object[key])) {
            for(let i = 0; i < object[key].length; i++){
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
async function insertObjectRecords(lightDBEnclaveClient, tableId, objectId, objectData){
    let object = {};
    for(let key of Object.keys(objectData)){
        if(Array.isArray(objectData[key])){
            if(objectData[key].length > 0){
                object[key] = [];
                if(typeof objectData[key][0] === "object"){
                    for(let item of objectData[key]){
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
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data:object});
}
async function addContainerObjectToTable(lightDBEnclaveClient, objectType, objectData){
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
    // let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    // await $$.promisify(lightDBEnclaveClient.createDatabase)(spaceId);
    // await $$.promisify(lightDBEnclaveClient.grantWriteAccess)($$.SYSTEM_IDENTIFIER);
    try {
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        let objectId = await addContainerObjectToTable(lightDBEnclaveClient, objectType, objectData);
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
        await deleteContainerObjectTable(lightDBEnclaveClient, spaceId, objectId);
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
            for(let i = 0; i < object[key].length; i++){
                let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, object[key][i]);
                object[key][i] = await constructEmbeddedObject(lightDBEnclaveClient, tableId, record);
            }
        }
    }
    return object;
}
async function getEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    let objectURI = decodeURIComponent(request.params.objectURI);
    try {
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        let [tableId, objectId] = objectURI.split("/");
        let embeddedObjectRecord = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
        let embeddedObject = await constructEmbeddedObject(lightDBEnclaveClient, tableId, embeddedObjectRecord);
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
async function insertEmbeddedObjectRecords(lightDBEnclaveClient, tableId, objectURI, objectData, isUpdate = false){
    let segments = objectURI.split("/");
    let pk = segments[0];
    segments = segments.slice(1);
    let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, pk);
    let object = record.data;
    if(segments.length === 1){
        let objectType = segments[0].split('_')[0];
        if(!object[objectType]){
            object[objectType] = [];
        }
        let objectId;
        if(isUpdate){
            objectId = objectData.id;
        } else{
            objectId = `${objectType}_${crypto.generateId()}`;
            objectData.id = objectId;
        }
        if(objectData.position){
            object[objectType].splice(objectData.position, 0, objectId);
        } else {
            object[objectType].push(objectId);
        }
        await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, pk, {data: object});
        await insertObjectRecords(lightDBEnclaveClient, tableId, objectId, objectData);
        return objectId;
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
        let tableId = objectURI.split("/")[0];
        let objectId = await insertEmbeddedObjectRecords(lightDBEnclaveClient, tableId, objectURI, objectData);
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
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        let [tableId, objectId, propertyName] = objectURI.split("/");
        if(!propertyName && !objectId.includes("_")){
            propertyName = objectId;
            objectId = tableId;
        }
        if(propertyName){
            let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
            let object = record.data;
            object[propertyName] = objectData;
            await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: object});
        } else {
            await deleteEmbeddedObjectDependencies(lightDBEnclaveClient, tableId, objectId);
            await insertEmbeddedObjectRecords(lightDBEnclaveClient, tableId, objectURI, objectData, true);
            // let embeddedObjectRecord = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
            // let embeddedObject = await constructEmbeddedObject(lightDBEnclaveClient, tableId, embeddedObjectRecord);
            //
            // const updatedObject = JSON.parse(JSON.stringify(embeddedObject));
            // const propertiesToUpdate = Object.keys(objectData);
            // propertiesToUpdate.forEach(property => {
            //     if (objectData.hasOwnProperty(property) && property!== "id") {
            //         updatedObject[property] = objectData[property];
            //     }
            // });
            //await insertEmbeddedObjectRecords(lightDBEnclaveClient, tableId, objectURI, updatedObject, true);
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
async function deleteEmbeddedObjectDependencies(lightDBEnclaveClient, tableId, objectId){
    let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
    let object = record.data;
    for(let key of Object.keys(object)){
        if(Array.isArray(object[key])){
            for(let item of object[key]){
                await deleteEmbeddedObjectDependencies(lightDBEnclaveClient, tableId, item);
            }
        }
    }
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
}
async function deleteEmbeddedObjectFromTable(lightDBEnclaveClient, tableId, objectURI){
    let segments = objectURI.split("/");
    let pk = segments[0];
    segments = segments.slice(1);
    let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, pk);
    let object = record.data;
    if(segments.length === 1){
        let objectId = segments[0];
        let objectType = objectId.split('_')[0];
        if(object[objectType]){
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
        let tableId = objectURI.split("/")[0];
        await deleteEmbeddedObjectFromTable(lightDBEnclaveClient, tableId, objectURI);
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
        let [tableId, objectId, propertyName] = objectURI.split("/");
        if(!propertyName && !objectId.includes("_")){
            propertyName = objectId;
            objectId = tableId;
        }
        let record = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId);
        let object = record.data;
        let index1 = object[propertyName].indexOf(embeddedId1);
        let index2 = object[propertyName].indexOf(embeddedId2);
        if(index1 === -1 || index2 === -1){
            return utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: ` Error at swapping objects: ${objectURI}`
            });
        }
        object[propertyName][index1] = embeddedId2;
        object[propertyName][index2] = embeddedId1;
        await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, tableId, objectId, {data: object});
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
    swapEmbeddedObjects,
    deleteEmbeddedObject,
    getSpace,
    createSpace,
    addCollaboratorToSpace
}