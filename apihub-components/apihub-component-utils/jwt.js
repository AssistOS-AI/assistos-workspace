const JWTConfigs = require('../securityConfig.json').JWT;
const crypto = require('opendsu').loadAPI('crypto');

const date = require('../../assistOS-sdk/Loader.js').loadModule('util', 'date');


async function createJWT(payloadData, jwtType) {

    if (!JWTConfigs[jwtType]) {
        throw new Error(`Invalid JWT type: ${jwtType}`);
    }

    const jwtConfig = JWTConfigs[jwtType];

    const payload = {
        ...payloadData,
        iat: date.getCurrentUnixTime(),
        exp: date.incrementUnixTime(date.getCurrentUnixTime(), jwtConfig.expiresIn),
        iss: jwtConfig.issuer,
        aud: jwtConfig.audience
    };

    const jwt = await crypto.joseAPI.createSignedHmacJWT(payload, jwtConfig.secret);

    return jwt;
}

async function validateJWT(jwt, jwtType) {

    if (!JWTConfigs[jwtType]) {
        throw new Error(`Invalid JWT type: ${jwtType}`);
    }

    const jwtConfig = JWTConfigs[jwtType];
    return await crypto.joseAPI.verifyAndRetrievePayloadHmacJWT(jwt, jwtConfig.secret);

}

async function createUserAccessJWT(userData) {
    const payloadData = {
        id: userData.id,
        role: "user"
    }
    const accessToken = await createJWT(payloadData, "AccessToken");
    return accessToken

}

async function createUserRefreshAccessJWT(userData) {
    const payloadData = {
        id: userData.id,
        role: "user"
    }
    const refreshToken = await createJWT(payloadData, "RefreshToken");
    return refreshToken
}

async function validateUserAccessJWT(jwt) {
    const jwtPayload = (await validateJWT(jwt, "AccessToken")).payload
    const userId = jwtPayload.id;
    return userId;
}

async function validateUserRefreshAccessJWT(jwt) {
    const jwtPayload = (await validateJWT(jwt, "RefreshToken")).payload
    const userId = jwtPayload.id;
    return userId;
}

module.exports = {
    createJWT,
    validateJWT,
    createUserAccessJWT,
    createUserRefreshAccessJWT,
    validateUserAccessJWT,
    validateUserRefreshAccessJWT
}