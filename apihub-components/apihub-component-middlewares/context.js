const cookie = require('../apihub-component-utils/cookie.js');
async function contextMiddleware(req, res, next) {
    const cookies = cookie.parseRequestCookies(req);
    req.currentSpaceId = cookies['currentSpaceId'];
    next();
}


module.exports = contextMiddleware;
