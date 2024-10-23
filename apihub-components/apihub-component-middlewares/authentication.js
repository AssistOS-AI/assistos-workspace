const cookie = require('../apihub-component-utils/cookie.js');
const jwt = require('../apihub-component-utils/jwt.js');
const utils = require('../apihub-component-utils/utils.js');
const config = require('../../data-volume/config/config.json');
const User = require('../users-storage/user.js');
const secrets = require('../apihub-component-utils/secrets.js');
async function authentication(req, res, next) {
    const cookies = cookie.parseCookies(req);
    const sessionId = cookies['sessionId'];
    const authToken = cookies['authToken'];
    const apiHubToken = cookies['ApiHubAuth'];
    const refreshToken = cookies['refreshAuthToken'];
    let setCookies = [];
    if(sessionId) {
        req.sessionId = sessionId;
    }
    if(apiHubToken) {
        let secret = await secrets.getApiHubAuthSecret();
        if(secret === apiHubToken) {
            req.userId = cookies.userId;
            req.skipAuthorisation = true;
            return next();
        }else {
            return authenticationError(res, next);
        }
    }
    if (authToken) {
        try {
            const {userId} = await jwt.validateUserAccessJWT(authToken, 'AccessToken');
            req.userId = userId;
            return next();
        } catch (error) {
            // invalid token, ignore error and attempt to generate a new authToken
        }
    }

    if (refreshToken) {
        try {
            const {userId} = await jwt.validateUserRefreshAccessJWT(refreshToken, 'RefreshToken');
            const userData = await User.getUserData(userId);
            const newAuthCookie = await cookie.createAuthCookie(userData);
            setCookies.push(newAuthCookie);
            req.userId = userId;
            res.setHeader('Set-Cookie', setCookies);
            return next();
        } catch (error) {
            res.setHeader('Set-Cookie', setCookies);
            return authenticationError(res, next);
        }
    } else {
        res.setHeader('Set-Cookie', setCookies);
        return authenticationError(res, next);
    }
}

function authenticationError(res, next) {
    const error = new Error('Authentication failed');
    error.statusCode = 401;
    if (config.CREATE_DEMO_USER === true) {
        const {email, password} = User.templates.demoUser;
        utils.sendResponse(res, 401, "application/json", {
            success: false,
            message: "Unauthorized"
        }, [cookie.createDemoUserCookie(email, password), cookie.deleteAuthCookie(), cookie.deleteRefreshAuthCookie(), cookie.deleteCurrentSpaceCookie()]);
    } else {
        utils.sendResponse(res, 401, "application/json", {
            success: false,
            message: "Unauthorized"
        }, [cookie.deleteDemoUserCookie(), cookie.deleteAuthCookie(), cookie.deleteRefreshAuthCookie(), cookie.deleteCurrentSpaceCookie()]);
    }
    next(error);
}

module.exports = authentication;
