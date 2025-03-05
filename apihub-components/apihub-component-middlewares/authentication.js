const cookie = require('../apihub-component-utils/cookie.js');
const utils = require('../apihub-component-utils/utils.js');
const config = require('../../data-volume/config/config.json');
const secrets = require('../apihub-component-utils/secrets.js');
const demoUser = require('../users-storage/demoUser.json')
async function authentication(req, res, next) {
    const cookies = cookie.parseCookies(req);
    const sessionId = cookies['sessionId'];
    const apiHubToken = cookies['ApiHubAuth'];
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
}

function authenticationError(res, next) {
    const error = new Error('Authentication failed');
    error.statusCode = 401;
    if (config.CREATE_DEMO_USER === true) {
        const {email, password} = demoUser
        utils.sendResponse(res, 401, "application/json", {
            message: "Unauthorized"
        }, [cookie.createDemoUserCookie(email, password), cookie.deleteCurrentSpaceCookie()]);
    } else {
        utils.sendResponse(res, 401, "application/json", {
            message: "Unauthorized"
        }, [cookie.deleteDemoUserCookie(), cookie.deleteCurrentSpaceCookie()]);
    }
    next(error);
}

module.exports = authentication;
