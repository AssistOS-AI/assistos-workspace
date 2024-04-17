const cookie = require('../apihub-component-utils/cookie.js');
const jwt = require('../apihub-component-utils/jwt.js');
const utils = require('../apihub-component-utils/utils.js');

const configs = require("../../config.json");

const Loader = require('../../assistOS-sdk')

const user = Loader.loadModule('user');
const userAPIs = user.loadAPIs();
const userData = user.loadData('templates');

async function authentication(req, res, next) {
    const cookies = cookie.parseCookies(req);
    const authToken = cookies['authToken'];
    const refreshToken = cookies['refreshAuthToken'];
    let setCookies = [];

    if (authToken) {
        try {
            const userId = await jwt.validateUserAccessJWT(authToken, 'AccessToken');
            req.userId = userId;
            return next();
        } catch (error) {
        }
    }

    if (refreshToken) {
        try {
            const userId = await jwt.validateUserRefreshAccessJWT(refreshToken, 'RefreshToken');
            const userData = await userAPIs.getUserData(userId);
            const newAuthCookie = await cookie.createAuthCookie(userData);
            setCookies.push(newAuthCookie);
            req.userId = userId;
            res.setHeader('Set-Cookie', setCookies);
            next();
        } catch (error) {
            res.setHeader('Set-Cookie', setCookies);
            authenticationError(res, next);
        }
    } else {
        res.setHeader('Set-Cookie', setCookies);
        authenticationError(res, next);
    }
}

function authenticationError(res, next) {
    const error = new Error('Authentication failed');
    error.statusCode = 401;
    if (configs.CREATE_DEMO_USER === 'true') {
        utils.sendResponse(res, 401, "application/json", {
            success: false,
            message: "Unauthorized"
        }, [cookie.createDemoUserCookie(userData.demoUser.email, userData.demoUser.password), cookie.deleteAuthCookie(), cookie.deleteRefreshAuthCookie(), cookie.deleteCurrentSpaceCookie()]);
    } else {
        utils.sendResponse(res, 401, "application/json", {
            success: false,
            message: "Unauthorized"
        }, [cookie.deleteDemoUserCookie(), cookie.deleteAuthCookie(), cookie.deleteRefreshAuthCookie(), cookie.deleteCurrentSpaceCookie()]);
    }
    next(error);
}

module.exports = authentication;
