const {
    parseCookies,
    createAuthCookie
} = require('../apihub-component-utils/exporter.js')('parseCookies', 'createAuthCookie');
const {createJWT, validateJWT} = require('../../apihub-core/exporter.js')('createJWT', 'validateJWT');

async function authentication(req, res, next) {
    const cookies = parseCookies(req);
    const authToken = cookies['authToken'];
    const refreshToken = cookies['refreshAuthToken'];

    if (authToken) {
        const jwtValidation = await validateJWT(authToken, 'AccessTokens');
        if (jwtValidation) {
            req.userId = jwtValidation.payload.id;
            return next();
        }
    }

    if (refreshToken) {
        try {
            const jwtValidation = await validateJWT(refreshToken, 'RefreshTokens');
            if (!jwtValidation) {
                throw new Error('RefreshToken validation failed');
            }
            const newAccessToken = await createJWT(jwtValidation.payload, 'AccessTokens');
            const authCookie = createAuthCookie(newAccessToken);
            res.setHeader('Set-Cookie', authCookie);
            req.userId = jwtValidation.payload.id;
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
