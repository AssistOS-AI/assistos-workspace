const cookie = require('../apihub-component-utils/cookie.js');
const jwt = require('../apihub-component-utils/jwt.js');
const utils = require('../apihub-component-utils/utils.js');

const config = require('../config.json')
const User=require('../users-storage/user.js');

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
            const userData = await User.APIs.getUserData(userId);
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
    if (config.CREATE_DEMO_USER === 'true') {
        const {email,password}=User.templates.demoUser;
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
