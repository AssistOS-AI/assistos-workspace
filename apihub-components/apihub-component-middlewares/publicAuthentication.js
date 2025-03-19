const cookie = require('../apihub-component-utils/cookie.js');
const utils = require('../apihub-component-utils/utils.js');

async function publicAuthentication(req, res, next) {
    const cookies = cookie.parseRequestCookies(req);

    const userId = cookies['userId'];
    if (!userId) {
        return authenticationError(res, next);
    }
    req.userId = userId;
    const sessionId = cookies['sessionId'];
    if (sessionId) {
        req.sessionId = sessionId;
    }
    return next();
}

function authenticationError(res, next) {
    const error = new Error('Authentication failed');
    error.statusCode = 401;
    return utils.sendResponse(res, 401, "application/json", {
        message: `Unauthorized, could not identify the user, due to missing "userId" cookie`
    });
}

module.exports = publicAuthentication;
