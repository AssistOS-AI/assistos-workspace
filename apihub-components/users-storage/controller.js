const fsPromises = require('fs').promises;
const path = require('path');
const Manager = require('../../apihub-space-core/Manager.js').getInstance();
const {sendResponse, createCookieString, parseCookies} = require('../requests-processing-apis/exporter.js')
('sendResponse', 'createCookieString', 'parseCookies');
async function saveJSON(response, spaceData, filePath) {
    try {
        await fsPromises.writeFile(filePath, spaceData, 'utf8');
    } catch (error) {
        sendResponse(response, 500, "text/html", error + ` Error at writing space: ${filePath}`);
        return false;
    }
    return true;
}


function createContainerName(spaceId, userId) {
    return `${spaceId}.${userId}`;
}

async function storeSecret(server, request, response) {
    try {
        let spaceId = request.params.spaceId;
        let userId = request.params.userId;
        let containerName = createContainerName(spaceId, userId);
        const secretsService = await require('apihub').getSecretsServiceInstanceAsync(server.rootFolder);
        let body = JSON.parse(request.body.toString());
        if (body.delete) {
            //delete
            await secretsService.deleteSecretAsync(containerName, body.secretName);
            return sendResponse(response, 200, "text/plain", "Success");
        }
        await secretsService.putSecretAsync(containerName, body.secretName, body.secret);
        sendResponse(response, 200, "text/plain", "Succes");
    } catch (e) {
        sendResponse(response, 500, "text/plain", JSON.stringify(e));
    }
}

async function loadUsersSecretsExist(server, request, response) {
    try {
        let spaceId = request.params.spaceId;
        let users = await loadUsers(`../apihub-root/users`);
        const secretsService = await require('apihub').getSecretsServiceInstanceAsync(server.rootFolder);
        let secretsExistArr = [];
        for (let user of users) {
            let containerName = createContainerName(spaceId, user.id);
            try {
                secretsService.getSecretSync(containerName, "username");
                //secretsService.getSecretSync(containerName, "token");
                secretsExistArr.push({name: user.name, id: user.id});
            } catch (e) {
                //secret for user doesn't exist
            }
        }
        sendResponse(response, 200, "application/json", JSON.stringify(secretsExistArr));
    } catch (e) {
        sendResponse(response, 500, "application/json", JSON.stringify(e));
    }
}

async function loadUsers(filePath) {
    let localData = [];
    const files = await fsPromises.readdir(filePath);

    const statPromises = files.map(async (file) => {
        const fullPath = path.join(filePath, file);
        const stat = await fsPromises.stat(fullPath);
        return {file, stat};
    });

    let fileStats = (await Promise.all(statPromises)).filter(stat => stat !== undefined);

    fileStats.sort((a, b) => a.stat.ctimeMs - b.stat.ctimeMs);

    for (const {file} of fileStats) {
        localData.push(JSON.parse(await fsPromises.readFile(path.join(filePath, file), 'utf8')));
    }
    return localData;
}

async function storeUser(request, response) {
    const filePath = `../apihub-root/users/${request.params.userId}.json`;
    let userData = request.body.toString();
    if (userData === "") {
        await fsPromises.unlink(filePath);
        sendResponse(response, 200, "text/html", `Deleted successfully ${request.params.userId}`);
        return "";
    }
    let jsonData = JSON.parse(userData);
    if (await saveJSON(response, JSON.stringify(jsonData), filePath)) {
        let message = {
            id: jsonData.id,
            secretToken: jsonData.secretToken,
            spaces: jsonData.spaces,
            currentSpaceId: jsonData.currentSpaceId
        };
        sendResponse(response, 200, "application/json", JSON.stringify(message));
    }
}

async function loadUser(request, response) {
    const userId = request.params.userId;
    const userData = await Manager.apis.getUserData(userId);
    sendResponse(response, 200, "application/json", userData);
    return "";
}

async function loadUserByEmail(request, response) {
    let email = request.body.toString();
    let users = [];

    for (let item of await fsPromises.readdir("../apihub-root/users")) {
        let result = await fsPromises.readFile(`../apihub-root/users/${item}`);
        users.push(JSON.parse(result));
    }

    let user = users.find(user => user.email === email);
    if (user) {
        sendResponse(response, 200, "application/json", JSON.stringify(user));
        return "";
    }

    sendResponse(response, 404, "text/html", "User not found");
    return "";
}

module.exports = {
    storeUser,
    loadUser,
    loadUserByEmail,
    storeSecret,
    loadUsersSecretsExist
};