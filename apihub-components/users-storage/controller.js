const jwt=require('../apihub-component-utils/jwt.js')
const cookie = require('../apihub-component-utils/cookie.js');
const utils = require('../apihub-component-utils/utils.js');

const configs = require('../../config.json')
const Loader = require('../../apihub-core/Loader.js');
const user = Loader.loadModule('user');

async function loginUser(request, response) {

    const userData = request.body;
    try {
        const loginResult = await user.apis.loginUser(
            userData.email,
            userData.password);
        if (loginResult.success) {

            const userData = await user.apis.getUserData(loginResult.userId);

            const authCookie = await cookie.createAuthCookie(userData);
            const refreshAuthCookie = await cookie.createRefreshAuthCookie(userData);
            const currentSpaceCookie =  cookie.createCurrentSpaceCookie(userData.currentSpaceId);

            utils.sendResponse(response, 200, "application/json", {
                data: userData,
                success: true,
                message: `User ${userData.name} logged in successfully`
            }, [authCookie, refreshAuthCookie, currentSpaceCookie]);
        } else {
            utils.sendResponse(response, 404, "application/json", {
                success: false,
                message: loginResult.message
            });
        }
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function registerUser(request, response) {
    const userData = request.body;
    try {
        await user.apis.registerUser(
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
    const queryParams = utils.extractQueryParams(request);
    const activationToken = queryParams['activationToken'];
    if (!activationToken) {
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "No activation token provided."
        });
    }
    try {
        await user.apis.activateUser(activationToken);
        const activationSuccessHTML = await user.apis.getActivationSuccessHTML();
        await utils.sendFileToClient(response, activationSuccessHTML, "html")
    } catch (error) {
        const activationFailHTML = await user.apis.getActivationFailHTML(error.message);
        await utils.sendFileToClient(response, activationFailHTML, "html")
    }
}


async function loadUser(request, response) {
    const authCookie = cookie.parseCookies(request).authToken;
    if (!authCookie) {
        if (configs.CREATE_DEMO_USER === 'true') {
            const demoCredentialsCookie = cookie.createCookieString("demoCredentials", JSON.stringify({
                    email: user.data.demoUser.email,
                    password: user.data.demoUser.password
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
        const userId = await jwt.validateUserAccessJWT(authCookie)
        const userData = await user.apis.getUserData(userId);
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