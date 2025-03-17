const cookie = require('../apihub-component-utils/cookie.js');
const secrets = require('../apihub-component-utils/secrets.js');
async function contextMiddleware(req, res, next) {
    const cookies = cookie.parseRequestCookies(req);
    req.sessionId = cookies['sessionId'];
    req.email = cookies['email'];
    req.authKey = cookies['authKey'];

    // const apiHubToken = cookies['ApiHubAuth'];
    // if(apiHubToken) {
    //     let secret = await secrets.getApiHubAuthSecret();
    //     if(secret === apiHubToken) {
    //         req.skipAuthorisation = true;
    //         return next();
    //     }else {
    //         return authenticationError(res, next);
    //     }
    // }
    next();
}


module.exports = contextMiddleware;
