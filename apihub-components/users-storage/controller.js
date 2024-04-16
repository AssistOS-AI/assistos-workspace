const jwt = require('../apihub-component-utils/jwt.js')
const cookie = require('../apihub-component-utils/cookie.js');
const utils = require('../apihub-component-utils/utils.js');

const configs = require('../../config.json')
const Loader = require('../../assistOS-sdk/Loader.js');
const userModule = Loader.loadModule('user');

async function registerUser(request, response) {
    const userAPIs = userModule.loadAPIs();
    const userData = request.body;
    try {
        await userAPIs.registerUser(
            userData.name,
            userData.email,
            userData.password);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `User ${userData.name} registered successfully. Please check your email for the verification code`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function activateUser(request, response) {
    const userAPIs = userModule.loadAPIs();
    const queryParams = utils.extractQueryParams(request);
    const activationToken = queryParams['activationToken'];
    if (!activationToken) {
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "No activation token provided."
        });
    }
    try {
        await userAPIs.activateUser(activationToken);
        const activationSuccessHTML = await userAPIs.getActivationSuccessHTML();
        await utils.sendFileToClient(response, activationSuccessHTML, "html")
    } catch (error) {
        const activationFailHTML = await userAPIs.getActivationFailHTML(error.message);
        await utils.sendFileToClient(response, activationFailHTML, "html")
    }
}

async function loginUser(request, response) {
    const userAPIs = userModule.loadAPIs();
    const requestData = request.body;
    try {
        const userId = await userAPIs.loginUser(requestData.email, requestData.password);
        const userData = await userAPIs.getUserData(userId);

        utils.sendResponse(response, 200, "application/json", {
            data: userData,
            success: true,
            message: `User ${userData.name} logged in successfully`
        }, [await cookie.createAuthCookie(userData), await cookie.createRefreshAuthCookie(userData), cookie.createCurrentSpaceCookie(userData.currentSpaceId)]);
    } catch (error) {
        utils.sendResponse(response, 404, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function loadUser(request, response) {
    try {
        const userAPIs = userModule.loadAPIs();
        const userId = request.userId
        const userData = await userAPIs.getUserData(userId);
        utils.sendResponse(response, 200, "application/json", {
            data: userData,
            success: true,
            message: `User ${userData.name} loaded successfully`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        }, [cookie.createCurrentSpaceCookie(), cookie.createAuthCookie()]);
    }
}

async function logoutUser(request, response) {
    if (!request.userId) {
        return utils.sendResponse(response, 401, "application/json", {
            success: false,
            message: "Unauthorized"
        });
    }
    try {
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: "User logged out successfully"
        }, [cookie.deleteAuthCookie(), cookie.deleteRefreshAuthCookie(), cookie.deleteCurrentSpaceCookie()]);
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    registerUser,
    activateUser,
    loginUser,
    loadUser,
    logoutUser
};