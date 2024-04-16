const path = require('path');
const fsPromises = require('fs').promises;

const requestUtils = require('../apihub-component-utils/utils.js');
const cookieUtils = require('../apihub-component-utils/cookie.js');
const jwtUtils=require('../apihub-component-utils/jwt.js');

const Loader = require('../../assistOS-sdk/Loader.js');
const utilsModule = Loader.loadModule('util');
const userModule= Loader.loadModule('user');
const spaceModule= Loader.loadModule('space');
const spaceAPIs= spaceModule.loadAPIs();
const openAI = utilsModule.loadAPIs('openAI');
const sendResponse = requestUtils.sendResponse;
const createCookieString = cookieUtils.createCookieString;
const parseCookies = cookieUtils.parseCookies;

async function saveJSON(response, spaceData, filePath) {

    const folderPath = path.dirname(filePath);
    try {
        await fsPromises.access(filePath);
    } catch (e) {
        try {
            await fsPromises.mkdir(folderPath, {recursive: true});
        } catch (error) {
            sendResponse(response, 500, "text/html", error + ` Error at creating folder: ${folderPath}`);
            return false;
        }
    }
    try {
        await fsPromises.writeFile(filePath, spaceData, 'utf8');
    } catch (error) {
        sendResponse(response, 500, "text/html", error + ` Error at writing space: ${filePath}`);
        return false;
    }
    return true;
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
async function getObject(request, response) {
    try {
        let object = await spaceAPIs.getObject(request.params.spaceId, request.params.objectType, request.params.objectName);
        return sendResponse(response, 200, "text/html", JSON.stringify(object));
    } catch (e) {
        return sendResponse(response, 500, "text/html", JSON.stringify(e + ` Error at getting object: ${request.params.objectType}`));
    }
}
async function addObject(request, response) {
    try {
        let object = await spaceAPIs.addObject(request.params.spaceId, request.params.objectType, request.body);
        return sendResponse(response, 200, "text/html", JSON.stringify(object));
    } catch (e) {
        return sendResponse(response, 500, "text/html", JSON.stringify(e + ` Error at adding object: ${request.params.objectType}`));
    }
}

async function updateObject(request, response) {
    try {
        let objectId = await spaceAPIs.updateObject(request.params.spaceId, request.params.objectType, request.params.objectName, request.body);
        return sendResponse(response, 200, "text/html", objectId);
    } catch (e) {
        return sendResponse(response, 500, "text/html", JSON.stringify(e + ` Error at updating object: ${request.params.objectType}: ${request.params.objectName}`));
    }
}

async function deleteObject(request, response) {
    try {
        let objectId = await spaceAPIs.deleteObject(request.params.spaceId, request.params.objectType, request.params.objectName);
        return sendResponse(response, 200, "text/html", JSON.stringify(objectId));
    } catch (e) {
        return sendResponse(response, 500, "text/html", JSON.stringify(e + ` Error at deleting object: ${request.params.objectType}: ${request.params.objectName}`));
    }
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

async function storeFolder(spaceId, data, folderName) {
    if (data) {
        let folderPath = `../data-volume/spaces/${spaceId}/${folderName}`;
        try {
            await fsPromises.access(folderPath);
        } catch (e) {
            await fsPromises.mkdir(folderPath);
        }
        if (data !== "newFolder") {
            if (folderName !== "status") {
                for (let item of data) {
                    await saveJSON(null, JSON.stringify(item), `${folderPath}/${item.id}.json`);
                }
            } else {
                await saveJSON(null, JSON.stringify(data), `${folderPath}/${folderName}.json`);
            }
        }
    }
}

async function saveSpaceAPIKeySecret(spaceId, apiKey, server) {
    const secretsService = await require('apihub').getSecretsServiceInstanceAsync(server.rootFolder);
    const containerName = `${spaceId}.APIKey`
    const keyValidation = await openAI.validateOpenAiKey(apiKey);
    if (keyValidation) {
        await secretsService.putSecretAsync(containerName, "OpenAiAPIKey", apiKey);
        return true;
    }
    return false;
}


async function storeSecret(request, response, server) {
    const apiKey = request.headers['apikey'];
    const userId = request.headers['initiatorid'];

    if (!apiKey) {
        sendResponse(response, 400, "text/html", "No API Key provided");
        return;
    }
    if (await saveSpaceAPIKeySecret(request.params.spaceId, apiKey, server)) {
        const spaceStatusPath = `../data-volume/spaces/${request.params.spaceId}/status/status.json`;
        try {
            const statusData = await fsPromises.readFile(spaceStatusPath, 'utf8');
            const statusObject = JSON.parse(statusData);
            const apiKeyObject = {
                "userId": `${userId}`,
                "id": "000000000000",
                "value": openAI.maskKey(apiKey)
            };
            if (statusObject.apiKeys && statusObject.apiKeys.openAi) {
                statusObject.apiKeys.openAi.push(apiKeyObject);
            } else {
                statusObject.apiKeys = {
                    "openAi": [apiKeyObject]
                };
            }
            const jsonString = JSON.stringify(statusObject, null, 2);
            await fsPromises.writeFile(spaceStatusPath, jsonString, 'utf8');
            sendResponse(response, 200, "text/html", "API Key added successfully");
        } catch (error) {
            console.error('Error while processing:', error);
            sendResponse(response, 500, "text/html", "Internal Server Error");
        }
    } else {
        sendResponse(response, 401, "text/html", "Invalid API Key provided");
    }
}

async function storeSpace(request, response, server) {

    const folderPath = `../data-volume/spaces/${request.params.spaceId}`;

    if (!request.body || Object.keys(request.body).length === 0) {
        try {
            await fsPromises.rm(folderPath, {recursive: true, force: true});
            sendResponse(response, 200, "text/html", "Space deleted successfully");
        } catch (err) {
            sendResponse(response, 500, "text/html", "Error deleting Space");
        }
        return;
    }

    try {
        await fsPromises.access(folderPath);
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fsPromises.mkdir(folderPath);
        } else {
            sendResponse(response, 500, "text/html", `Error creating Space: ${request.params.spaceId}`);
            return;
        }
    }

    const jsonData = request.body;
    const {apikey: apiKey, initiatorid: userId} = request.headers;

    if (apiKey) {
        if (await saveSpaceAPIKeySecret(request.params.spaceId, apiKey, server)) {
            jsonData.apiKeys = jsonData.apiKeys || {};
            jsonData.apiKeys.openAi = jsonData.apiKeys.openAi || [];
            jsonData.apiKeys.openAi.push({
                "userId": userId,
                "id": "000000000000",
                "value": openAI.maskKey(apiKey)
            });
        }
    }

    await storeFolder(request.params.spaceId, jsonData.documents, "documents");
    await storeFolder(request.params.spaceId, jsonData.personalities, "personalities");
    await storeFolder(request.params.spaceId, [], "applications");
    delete jsonData.personalities;
    delete jsonData.documents;
    await storeFolder(request.params.spaceId, jsonData, "status");
    sendResponse(response, 200, "text/html", `Success, updated space ${request.params.spaceId}`);
}


/* TODO constant object mapping of content types to avoid writing manually the content type of a response
*   and move the cookie verification authentication, rights, etc in a middleware */
async function getSpace(request, response) {
    const userAPIs= userModule.loadAPIs();
    const spaceAPIs = spaceModule.loadAPIs();
    try {
        let spaceId;
        const userId = request.userId;
        if (request.params.spaceId) {
            spaceId = request.params.spaceId;
        } else if (parseCookies(request).currentSpaceId) {
            spaceId = parseCookies(request).currentSpaceId;
        } else {
            spaceId = userAPIs.getDefaultSpaceId(userId);
        }

        const userRights = await getUserRights(userId);
        if (!userRights.readSpace) {
            sendResponse(response, 403, "application/json", {
                message: "Forbidden: User does not have the rights to read a space",
                success: false
            });
            return;
        }

        let spaceStatusObject = {};
        spaceStatusObject = await spaceAPIs.getSpaceStatusObject(spaceId);
        /* Packaging space Data into one Object */
        spaceStatusObject["documents"] = await spaceAPIs.getSpaceDocumentsObject(spaceId);
        spaceStatusObject["personalities"] = await spaceAPIs.getSpacePersonalitiesObject(spaceId);
        await userAPIs.updateUsersCurrentSpace(userId, spaceId);
        sendResponse(response, 200, "application/json", {
            success: true,
            data: spaceStatusObject,
            message: `Space ${spaceId} loaded successfully`
        },  cookieUtils.createCurrentSpaceCookie(spaceId));
    } catch (error) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: error
        });
    }
}


async function authenticateUser(userId) {
    const userFile = path.join(__dirname, `../../data-volume/users/${userId}.json`);
    try {
        await fsPromises.access(userFile);
        return true;
    } catch (e) {
        return false;
    }
}

async function getUserRights(userId) {
    return {readSpace: true, createSpace: true, addCollaborator: true};
}

async function addCollaboratorToSpace(request, response) {
    const cookies = parseCookies(request);
    const userId = cookies.userId;
    const userAPIs= userModule.loadAPIs();
    if (!userId) {
        sendResponse(response, 401, "application/json", {
            message: "Unauthorized: No valid session",
            success: false
        });
        return;
    }
    const userIsValid = await authenticateUser(userId);
    if (!userIsValid) {
        sendResponse(response, 401, "application/json", {
            message: "Unauthorized: Invalid user",
            success: false
        });
        return;
    }
    const userRights = await getUserRights(userId);
    if (!userRights.addCollaborator) {
        sendResponse(response, 403, "application/json", {
            message: "Forbidden: User does not have rights to create a space",
            success: false
        });
        return;
    }
    const spaceId = request.body.spaceId;
    const collaboratorId = request.body.collaboratorId;

    if (!spaceId || !collaboratorId) {
        sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space Id and Collaborator Id are required",
            success: false
        });
        return;
    }
    try {
        const space = await userAPIs.addSpaceCollaborator(spaceId, collaboratorId);
        sendResponse(response, 200, "application/json", {
            message: `Collaborator added successfully: ${collaboratorId}`,
            success: true
        });
    } catch (error) {
        switch (error.statusCode) {
            case 404:
                sendResponse(response, 404, "application/json", {
                    message: "Not Found: Space not found",
                    success: false
                });
                return;
            case 409:
                sendResponse(response, 409, "application/json", {
                    message: "Conflict: Collaborator already exists",
                    success: false
                });
                return;
            case 401:
                sendResponse(response, 401, "application/json", {
                    message: "Unauthorized: Invalid Collaborator Id",
                    success: false
                });
                return;
        }
        sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
            success: false
        });
    }

}

async function createSpace(request, response) {
    const authCookie = parseCookies(request).authToken;
    const userId = await jwtUtils.validateUserAccessJWT(authCookie)
    const spaceAPIs= spaceModule.loadAPIs();
    if (!userId) {
        sendResponse(response, 401, "application/json", {
            message: "Unauthorized: No valid session",
            success: false
        });
        return;
    }

    const userRights = await getUserRights(userId);
    if (!userRights.createSpace) {
        sendResponse(response, 403, "application/json", {
            message: "Forbidden: User does not have rights to create a space",
            success: false
        });
        return;
    }
    const spaceName = request.body.spaceName
    if (!spaceName) {
        sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space Name is required",
            success: false
        });
        return;
    }

    const apiKey = request.headers.apikey;
    try {
        let newSpace = {};
        newSpace = await spaceAPIs.createSpace(spaceName, userId, apiKey);
        sendResponse(response, 201, "application/json", {
            message: `Space created successfully: ${newSpace.id}`,
            data: newSpace,
            success: true
        }, cookieUtils.createCurrentSpaceCookie(newSpace.id));
    } catch (error) {
        switch (error.statusCode) {
            case 409:
                sendResponse(response, 409, "application/json", {
                    message: "Conflict: Space already exists",
                    success: false
                });
                return;
            case 401:
                sendResponse(response, 401, "application/json", {
                    message: "Unauthorized: Invalid API Key",
                    success: false
                });
                return;
        }
        sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
            success: false
        });
    }
}


module.exports = {
    storeObject,
    loadObject,
    getObject,
    addObject,
    updateObject,
    deleteObject,
    getSpace,
    storeSpace,
    createSpace,
    storeSecret,
    addCollaboratorToSpace
}