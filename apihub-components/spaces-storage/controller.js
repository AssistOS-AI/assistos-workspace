const path = require('path');
const fsPromises = require('fs').promises;
const crypto = require("opendsu").loadAPI("crypto");
const Manager = require('../../apihub-space-core/Manager.js').getInstance();

const {sendResponse, createCookieString, parseCookies} = require('../requests-processing-apis/exporter.js')
('sendResponse', 'createCookieString', 'parseCookies');

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
    const filePath = `../apihub-root/spaces/${request.params.spaceId}/${request.params.objectType}/${request.params.objectName}.json`;
    let data;
    try {
        data = await fsPromises.readFile(filePath, {encoding: 'utf8'});
    } catch (error) {
        sendResponse(response, 404, "text/html", error + ` Error space not found: ${filePath}`);
        return "";
    }
    sendResponse(response, 200, "text/html", data);
    return "";
}


async function storeObject(request, response) {
    const filePath = `../apihub-root/spaces/${request.params.spaceId}/${request.params.objectType}/${request.params.objectName}.json`;

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
        await fsPromises.writeFile(filePath, JSON.stringify(jsonData));
        sendResponse(response, 200, "text/html", `Success, saved ${request.params.objectName}`);
    } catch (error) {
        sendResponse(response, 500, "text/html", `Error saving ${request.params.objectName}`);
    }
}

async function storeFolder(spaceId, data, folderName) {
    if (data) {
        let folderPath = `../apihub-root/spaces/${spaceId}/${folderName}`;
        try {
            await fsPromises.access(folderPath);
        } catch (e) {
            /* the error is that the folder doesn't exist, it needs to be created*/
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
    const keyValidation = await Manager.apis.validateOpenAIKey(apiKey);
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
        const spaceStatusPath = `../apihub-root/spaces/${request.params.spaceId}/status/status.json`;
        try {
            const statusData = await fsPromises.readFile(spaceStatusPath, 'utf8');
            const statusObject = JSON.parse(statusData);
            const apiKeyObject = {
                "userId": `${userId}`,
                "id": "000000000000",
                "value": Manager.apis.maskOpenAIKey(apiKey)
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
    try {
        await fsPromises.stat(`../apihub-root/spaces`);
    } catch (e) {
        await fsPromises.mkdir(`../apihub-root/spaces`);
    }

    const folderPath = `../apihub-root/spaces/${request.params.spaceId}`;

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
                "value": Manager.apis.maskOpenAIKey(apiKey)
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

async function buildSpace(filePath) {
    let localData = [];
    const files = await fsPromises.readdir(filePath);

    const statPromises = files.map(async (file) => {
        const fullPath = path.join(filePath, file);
        const stat = await fsPromises.stat(fullPath);
        return {file, stat};
    });
    const fileStats = await Promise.all(statPromises);
    fileStats.sort((a, b) => a.stat.ctimeMs - b.stat.ctimeMs);
    for (const {file} of fileStats) {
        const jsonContent = await fsPromises.readFile(path.join(filePath, file), 'utf8');
        localData.push(JSON.parse(jsonContent));
    }
    return localData;
}

async function loadSpace(request, response) {
    let spaceId = request.params.spaceId;
    let filePath = `../apihub-root/spaces/${spaceId}`;
    let statusJson
    try {
        statusJson = await fsPromises.readFile(`${filePath}/status/status.json`);
        statusJson = JSON.parse(statusJson);
    } catch (e) {
        sendResponse(response, 404, "text/html", e + ` Error space not found: ${filePath}`);
        return;
    }
    for (let item of await fsPromises.readdir(filePath)) {
        if (item !== "status" && item !== "applications" && item !== "flows") {
            statusJson[item] = await buildSpace(`${filePath}\/${item}`);
        }
    }
    sendResponse(response, 200, "text/html", JSON.stringify(statusJson));
}


async function authenticateUser(userId) {
    const userFile = path.join(__dirname, `../../apihub-root/users/${userId}.json`);
    try {
        await fsPromises.access(userFile);
        return true;
    } catch (e) {
        return false;
    }
}

async function getUserRights(userId) {
    return {createSpace: true, addCollaborator: true};
}

async function addCollaboratorToSpace(request, response) {
    const cookies = parseCookies(request);
    const userId = cookies.userId;
    if (!userId) {
        sendResponse(response, 401, "text/html", "Unauthorized: No valid session");
        return;
    }
    const userIsValid = await authenticateUser(userId);
    if (!userIsValid) {
        sendResponse(response, 401, "text/html", "Unauthorized: Invalid user");
        return;
    }
    const userRights = await getUserRights(userId);
    if (!userRights.addCollaborator) {
        sendResponse(response, 403, "text/html", "Forbidden: User does not have rights to create a space");
        return;
    }
    const spaceId = request.body.spaceId;
    const collaboratorId = request.body.collaboratorId;

    if (!spaceId || !collaboratorId) {
        sendResponse(response, 400, "text/html", "Bad Request: Space Id and Collaborator Id are required");
        return;
    }
    try {
        const space = await Manager.apis.addSpaceCollaborator(spaceId, collaboratorId);
        sendResponse(response, 200, "text/html", `Collaborator added successfully: ${collaboratorId}`);
    } catch (error) {
        switch (error.statusCode) {
            case 404:
                sendResponse(response, 404, "text/html", "Not Found: Space not found");
                return;
            case 409:
                sendResponse(response, 409, "text/html", "Conflict: Collaborator already exists");
                return;
            case 401:
                sendResponse(response, 401, "text/html", "Unauthorized: Invalid Collaborator Id");
                return;
        }
        sendResponse(response, 500, "text/html", `Internal Server Error: ${error}`);
    }

}

async function createSpace(request, response) {
    debugger
    const cookies = parseCookies(request);
    const userId = cookies.userId;
    if (!userId) {
        sendResponse(response, 401, "text/html", "Unauthorized: No valid session");
        return;
    }
    const userIsValid = await authenticateUser(userId);
    if (!userIsValid) {
        sendResponse(response, 401, "text/html", "Unauthorized: Invalid user");
        return;
    }
    const userRights = await getUserRights(userId);
    if (!userRights.createSpace) {
        sendResponse(response, 403, "text/html", "Forbidden: User does not have rights to create a space");
        return;
    }
    const spaceName = request.body.spaceName
    if (!spaceName) {
        sendResponse(response, 400, "text/html", "Bad Request: Space Name is required");
        return;
    }

    const apiKey = request.headers.apikey;
    if (!apiKey) {
        sendResponse(response, 400, "text/html", "Bad Request: API Key is required");
        return;
    }

    try {
        let newSpace = {};
        newSpace = await Manager.apis.createSpace(spaceName, userId, apiKey);
        const cookieString = createCookieString('currentSpaceId', newSpace.id, {
            maxAge: 30 * 24 * 60 * 60,
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'Strict'
        });
        sendResponse(response, 201, "text/html", `Space created successfully: ${newSpace.id}`, cookieString);
    } catch (error) {
        switch (error.statusCode) {
            case 409:
                sendResponse(response, 409, "text/html", "Conflict: Space already exists");
                return;
            case 401:
                sendResponse(response, 401, "text/html", "Unauthorized: Invalid API Key");
                return;
        }
        sendResponse(response, 500, "text/html", `Internal Server Error: ${error}`);
    }
}


module.exports = {
    loadObject,
    storeObject,
    loadSpace,
    storeSpace,
    createSpace,
    storeSecret,
    addCollaboratorToSpace
}