const cookie = require('../apihub-component-utils/cookie.js');
const jwt = require('../apihub-component-utils/jwt.js');
const Loader = require('../../assistOS-sdk/Loader.js')
const user = Loader.loadModule('user');

async function authentication(req, res, next) {
    const cookies = cookie.parseCookies(req);
    const authToken = cookies['authToken'];
    const refreshToken = cookies['refreshAuthToken'];

    if (authToken) {
        const userId = await jwt.validateUserAccessJWT(authToken, 'AccessToken');
        req.userId = userId
        return next();
    }

    if (refreshToken) {
        try {
            const userId = await jwt.validateUserRefreshAccessJWT(refreshToken, 'RefreshToken');
            const userData = await user.apis.getUserData(userId);
            const authCookie = cookie.createAuthCookie(userData);
            res.setHeader('Set-Cookie', authCookie);
            req.userId = userId
            return next();
        } catch (error) {
            return authenticationError(next);
        }
    }

    return authenticationError(next);
}

function authenticationError(next) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    next();
}

module.exports = authentication
