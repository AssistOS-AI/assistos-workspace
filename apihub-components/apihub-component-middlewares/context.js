const cookie = require('../apihub-component-utils/cookie.js');
async function contextMiddleware(req, res, next) {
    const cookies = cookie.parseRequestCookies(req);
    req.sessionId = cookies['sessionId'];
    req.email = cookies['email'];
    next();
}


module.exports = contextMiddleware;
