const fsPromises = require('fs').promises;
const path = require('path');
const {
    sendResponse,
    createCookieString,
    parseCookies
} = require('../requests-processing-apis/exporter.js')
('sendResponse', 'createCookieString', 'parseCookies');

const Manager = require('../../apihub-space-core/Manager.js').getInstance();

async function loginUser(request, response) {
    const userData = request.body;
    try {
        const loginResult = await Manager.apis.loginUser(
            userData.email,
            userData.password);
        if (loginResult.success) {
            const userData = await Manager.apis.getUserData(loginResult.userId);
            const authCookie = createCookieString('authToken', await Manager.apis.createUserLoginJWT(userData), {
                httpOnly: true,
                sameSite: 'Strict',
                secure: true,
                maxAge: 60 * 60 * 24 * 7,
                path: '/'
            });
            const spaceCookie = createCookieString('currentSpaceId', userData.currentSpaceId, {
                httpOnly: true,
                sameSite: 'Strict',
                secure: true,
                maxAge: 60 * 60 * 24 * 7,
                path: '/'
            });
            sendResponse(response, 200, "application/json", {
                data: userData,
                success: true,
                message: `User ${userData.name} logged in successfully`
            }, [authCookie, spaceCookie]);
        } else {
            sendResponse(response, 404, "application/json", {
                success: false,
                message: loginResult.message
            });
        }
    } catch (error) {
        sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function registerUser(request, response) {
    const userData = request.body;
    try {
        await Manager.apis.registerUser(
            userData.name,
            userData.email,
            userData.password);
        sendResponse(response, 200, "application/json", {
            success: true,
            message: `User ${userData.name} registered successfully. Please check your email for the verification code`
        });
    } catch (error) {
        sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function activateUser(request, response, server) {
    const activationToken = request.body.activationToken;
    try {
        const userObject = await Manager.apis.activateUser(activationToken);
        sendResponse(response, 200, "application/json", {
            data: userObject,
            success: true,
            message: `User ${userObject.name} activated successfully`
        });
    } catch (error) {
        sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function loadUser(request, response) {
    try {
        const authCookie = parseCookies(request).authToken;
        if (!authCookie) {
            throw {
                statusCode: 401,
                message: "Unauthorized"
            };
        }
        const userId = await Manager.apis.decodeJWT(authCookie)
        const userData = await Manager.apis.getUserData(userId);
        sendResponse(response, 200, "application/json", {
            data: userData,
            success: true,
            message: `User ${userData.name} loaded successfully`
        });
    } catch (error) {
        sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function logoutUser(request, response) {
    const oldAuthCookie = parseCookies(request).authToken;
    if (!oldAuthCookie) {
        sendResponse(response, 401, "application/json", {
            success: false,
            message: "Unauthorized"
        });
        return;
    }
    try {
        const spaceCookie = createCookieString('currentSpaceId', '', {
            httpOnly: true,
            sameSite: 'Strict',
            secure: true,
            maxAge: 0,
            path: '/'
        });
        const authCookie = createCookieString('authToken', '', {
            httpOnly: true,
            sameSite: 'Strict',
            secure: true,
            maxAge: 0,
            path: '/'
        });
        sendResponse(response, 200, "application/json", {
            success: true,
            message: "User logged out successfully"
        }, [authCookie, spaceCookie]);
    } catch (error) {
        sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}

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
        sendResponse(response, 200, "text/plain", JSON.stringify(secretsExistArr));
    } catch (e) {
        sendResponse(response, 500, "text/plain", JSON.stringify(e));
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


module.exports = {
    registerUser,
    activateUser,
    loginUser,
    loadUser,
    logoutUser
};