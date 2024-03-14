const path = require('path');
const fsPromises = require('fs').promises;
const crypto = require("opendsu").loadAPI("crypto");
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

function sendResponse(response, statusCode, contentType, message, cookies) {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);

    if (cookies) {
        const cookiesArray = Array.isArray(cookies) ? cookies : [cookies];
        response.setHeader('Set-Cookie', cookiesArray);
    }

    response.write(message);
    response.end();
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
    if (request.body.toString() === "") {
        await fsPromises.unlink(filePath);
        sendResponse(response, 200, "text/html", `Deleted successfully ${request.params.objectName}`);
        return;
    }
    let jsonData = JSON.parse(request.body.toString());
    if (await saveJSON(response, JSON.stringify(jsonData), filePath)) {
        sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
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

/* Validate the key by calling the free listModels endpoint
*  The endpoint returns a list of models the users has access to
*/
async function validateOpenAiKey(apiKey) {
    const endpoint = 'https://api.openai.com/v1/models';
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        if (response.ok) {
            return true;
        } else {
            /* TODO Decide what to do further based on the response status */
            const errorData = await response.json();
            let errorMessage = `Error: ${response.status} - ${errorData.error}`;
            switch (response.status) {
                case 401:
                case 403:
                    errorMessage = 'Unauthorized: Invalid API Key';
                    break;
                case 404:
                    errorMessage = 'Invalid Endpoint';
                    break;
                case 500:
                case 502:
                case 503:
                case 504:
                    errorMessage = 'Server Error: OpenAI may be experiencing issues. Please try again later.';
                    break;
                default:
                    break;
            }
            return false;
        }
    } catch (error) {
        return false;
    }
}

async function saveSpaceAPIKeySecret(spaceId, apiKey, server) {
    const secretsService = await require('apihub').getSecretsServiceInstanceAsync(server.rootFolder);
    const containerName = `${spaceId}.APIKey`
    const keyValidation = await validateOpenAiKey(apiKey);
    if (keyValidation) {
        await secretsService.putSecretAsync(containerName, "OpenAiAPIKey", apiKey);
        return true;
    }
    return false;
}

function maskKey(str) {
    if (str.length <= 10) {
        return str;
    }
    const start = str.slice(0, 6);
    const end = str.slice(-4);
    const maskedLength = str.length - 10;
    const masked = '*'.repeat(maskedLength);
    return start + masked + end;
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
                "value": maskKey(apiKey)
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
    // Request to delete the space
    if (request.body.toString().trim() === "") {
        try {
            if (fsPromises.rm) {
                await fsPromises.rm(folderPath, {recursive: true, force: true});
            } else if (fsPromises.rmdir) {
                await fsPromises.rmdir(folderPath, {recursive: true});
            }
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
            sendResponse(response, 500, "text/html", err + ` Error creating Space: ${request.params.spaceId}`);
            return;
        }
    }
    const keyHeader = request.headers['apikey'];
    const initiatorHeader = request.headers['initiatorid'];

    let apiKey = null;
    let userId = null;
    if (keyHeader) {
        apiKey = keyHeader
        userId = initiatorHeader;
    }

    let jsonData = JSON.parse(request.body.toString());
    if (apiKey) {
        // const generateId = require('../../server-space-core/apis/exporter.js')('generateId');
        if (await saveSpaceAPIKeySecret(request.params.spaceId, apiKey, server)) {
            if (jsonData.apiKeys.openAi) {
                jsonData.apiKeys.openAi.push({
                    "userId": `${userId}`,
                    "id": "000000000000",
                    "value": maskKey(apiKey)
                })
            } else {
                jsonData.apiKeys = {
                    "openAi": [{
                        "userId": `${userId}`,
                        "id": "000000000000",
                        "value": maskKey(apiKey)
                    }]
                }
            }
        }
    }
    await storeFolder(request.params.spaceId, jsonData.documents, "documents");
    await storeFolder(request.params.spaceId, jsonData.personalities, "personalities");
    await storeFolder(request.params.spaceId, "newFolder", "applications");
    delete jsonData.personalities
    delete jsonData.documents;
    await storeFolder(request.params.spaceId, jsonData, "status");
    sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
    return "";
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
function createCookieString(name, value, options = {}) {
    let cookieString = `${name}=${value};`;

    if (options.maxAge) {
        cookieString += ` Max-Age=${options.maxAge};`;
    }
    if (options.path) {
        cookieString += ` Path=${options.path};`;
    }
    if (options.domain) {
        cookieString += ` Domain=${options.domain};`;
    }
    if (options.expires) {
        cookieString += ` Expires=${options.expires.toUTCString()};`;
    }
    if (options.httpOnly) {
        cookieString += ` HttpOnly;`;
    }
    if (options.secure) {
        cookieString += ` Secure;`;
    }
    if (options.sameSite) {
        cookieString += ` SameSite=${options.sameSite};`;
    }

    return cookieString;
}

function parseCookies(request) {
    const list = {};
    const cookieHeader = request.headers.cookie;

    if (cookieHeader) {
        cookieHeader.split(';').forEach(function(cookie) {
            const parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    }

    return list;
}

async function authenticateUser(userId) {
    const userFile= path.join(__dirname,`../../apihub-root/users/${userId}.json`);
    try {
        await fsPromises.access(userFile);
        return true;
    } catch (e) {
        return false;
    }
}
async function getUserRights(userId) {
    return {createSpace:true};
}
async function generateId(length=12){
    let random = crypto.getRandomSecret(length);
    let randomStringId = "";
    while (randomStringId.length < length) {
        randomStringId = crypto.encodeBase58(random).slice(0, length);
    }
    return randomStringId;
}
async function createSpace(request, response) {
    const cookies = parseCookies(request);
    const userId = cookies.userId;
    if (!userId) {
        sendResponse(response,401,"text/html","Unauthorized: No valid session");
        return;
    }
    const userIsValid = await authenticateUser(userId);
    if (!userIsValid) {
        sendResponse(response,401,"text/html","Unauthorized: Invalid user");
        return;
    }
    const userRights= await getUserRights(userId);
    if (!userRights.createSpace) {
        sendResponse(response,403,"text/html","Forbidden: User does not have rights to create a space");
        return;
    }
    const spaceName = request.body.spaceName;
    if (!spaceName) {
        sendResponse(response,400,"text/html","Bad Request: Space Name is required");
        return;
    }

    const apiKey = request.headers.apikey;
    if (!apiKey) {
        sendResponse(response,400,"text/html","Bad Request: API Key is required");
        return;
    }

    try {
        const newSpace = await createNewSpace(spaceName, userId,apiKey);
        const cookieString = createCookieString('currentSpaceId', newSpace.id, {
            maxAge: 30 * 24 * 60 * 60,
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'Strict'
        });
        sendResponse(response, 201, "text/html", `Space created successfully: ${newSpace.id}`, cookieString);
    } catch (error) {
       sendResponse(response,500,"text/html",`Internal Server Error: ${error}`);
    }
}
async function createNewSpace(spaceName,userId,apiKey){
    const spaceId = await generateId();
    const spacePath=path.join(__dirname,`../../apihub-root/spaces/${spaceId}`);
    try {
        await fsPromises.access(spacePath);
        const error = new Error('Space already exists');
        error.statusCode = 409;
        throw error;
    } catch (e) {
        if (e.code === 'ENOENT') {
            await fsPromises.mkdir(spacePath);
            //await createDefaultSpace(spacePath,spaceName,userId);
            return {id:spaceId}
        } else {
            throw e;
        }
    }
}

module.exports = {
    loadObject,
    storeObject,
    loadSpace,
    storeSpace,
    createSpace,
    storeSecret
}