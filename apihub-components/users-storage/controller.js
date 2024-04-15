const jwt = require('../apihub-component-utils/jwt.js')
const cookie = require('../apihub-component-utils/cookie.js');
const utils = require('../apihub-component-utils/utils.js');

const configs = require('../../config.json')
const Loader = require('../../assistOS-sdk/Loader.js');
const userModule = Loader.loadModule('user');

async function loginUser(request, response) {
    const userAPIs = userModule.loadAPIs();
    const requestData = request.body;
    try {
        const userId = await userAPIs.loginUser(requestData.email, requestData.password);
        const userData = await userAPIs.getUserData(userId);
        const authCookie = await cookie.createAuthCookie(userData);
        const refreshAuthCookie = await cookie.createRefreshAuthCookie(userData);
        const currentSpaceCookie = cookie.createCurrentSpaceCookie(userData.currentSpaceId);

        utils.sendResponse(response, 200, "application/json", {
            data: userData,
            success: true,
            message: `User ${userData.name} logged in successfully`
        }, [authCookie, refreshAuthCookie, currentSpaceCookie]);
    } catch (error) {
        utils.sendResponse(response, 404, "application/json", {
            success: false,
            message: error.message
        });
    }
}

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

async function activateUser(request, response, server) {
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

async function loadUser(request, response) {
    const userData = userModule.loadData('templates');
    if (!request.userId) {
        if (configs.CREATE_DEMO_USER === 'true') {
            const demoCredentialsCookie = cookie.createCookieString("demoCredentials", JSON.stringify({
                    email: userData.demoUser.email,
                    password: userData.demoUser.password
                }
            ), {
                path: "/",
                sameSite: 'Strict',
                maxAge: 60 * 60 * 24 * 7
            });
            utils.sendResponse(response, 401, "application/json", {
                success: false,
                message: "Unauthorized"
            }, demoCredentialsCookie);
        } else {
            const demoCredentialsCookie = cookie.createCookieString("demoCredentials", "", {
                path: "/",
                sameSite: 'Strict',
                maxAge: 0
            });
            utils.sendResponse(response, 401, "application/json", {
                success: false,
                message: "Unauthorized"
            }, demoCredentialsCookie);
        }
        return
    }
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
        const spaceCookie = cookie.createCookieString('currentSpaceId', '', {
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 0,
            path: '/'
        });
        const authCookie = cookie.createCookieString('authToken', '', {
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 0,
            path: '/'
        });
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        }, [authCookie, spaceCookie]);
    }
}

async function logoutUser(request, response) {
    const oldAuthCookie = cookie.parseCookies(request).authToken;
    if (!oldAuthCookie) {
        utils.sendResponse(response, 401, "application/json", {
            success: false,
            message: "Unauthorized"
        });
        return;
    }
    try {
        const spaceCookie = cookie.createCookieString('currentSpaceId', '', {
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 0,
            path: '/'
        });
        const authCookie = cookie.createCookieString('authToken', '', {
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 0,
            path: '/'
        });
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: "User logged out successfully"
        }, [authCookie, spaceCookie]);
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