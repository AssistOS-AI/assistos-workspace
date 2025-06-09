const cookie = require('../apihub-component-utils/cookie.js');
async function contextMiddleware(req, res, next) {
    const cookies = cookie.parseRequestCookies(req);
    req.currentSpaceId = cookies['currentSpaceId'];
    req.sessionId = cookies['sessionId'];
    req.userId = cookies['userId'];
    req.email = decodeURIComponent(cookies['email']);
    req.authToken = cookies["authToken"];
    next();
}


module.exports = contextMiddleware;
