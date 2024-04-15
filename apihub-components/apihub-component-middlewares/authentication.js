const cookie = require('../apihub-component-utils/cookie.js');
const jwt = require('../apihub-component-utils/jwt.js');
const Loader = require('../../assistOS-sdk/Loader.js')
const user = Loader.loadModule('user');

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
            const userData = await user.apis.getUserData(userId);
            const newAuthCookie = await cookie.createAuthCookie(userData);
            setCookies.push(newAuthCookie);
            req.userId = userId;
            res.setHeader('Set-Cookie', setCookies);
            return next();
        } catch (error) {
            setCookies.push(cookie.deleteAuthCookie());
            setCookies.push(cookie.deleteRefreshAuthCookie());
            res.setHeader('Set-Cookie', setCookies);
            return authenticationError(res, next);
        }
    } else {
        setCookies.push(cookie.deleteAuthCookie());
        setCookies.push(cookie.deleteRefreshAuthCookie());
        res.setHeader('Set-Cookie', setCookies);
        return authenticationError(res, next);
    }
}

function authenticationError(res, next) {
    return next();
}

module.exports = authentication;
