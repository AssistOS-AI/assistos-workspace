const crypto = require('opendsu').loadAPI('crypto');

const date=require('./date.js');

const securityConfig = require('../../data-volume/config/securityConfig.json');
const apihub = require('apihub');


async function createJWT(payloadData, jwtType) {
    const secretService = await apihub.getSecretsServiceInstanceAsync(securityConfig.SERVER_ROOT_FOLDER);
    const jwtConfig = secretService.getSecretSync('JWT', jwtType)

    const payload = {
        ...payloadData,
        iat: date.getCurrentUnixTimeSeconds(),
        exp: date.incrementUnixTime(date.getCurrentUnixTimeSeconds(), jwtConfig.expiresIn),
        iss: jwtConfig.issuer,
        aud: jwtConfig.audience
    };

    const jwt = await crypto.joseAPI.createSignedHmacJWT(payload, jwtConfig.secret);

    return jwt;
}

async function validateJWT(jwt, jwtType) {
    const secretService = await apihub.getSecretsServiceInstanceAsync(securityConfig.SERVER_ROOT_FOLDER);
    const jwtConfig = secretService.getSecretSync('JWT', jwtType)
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
    return {userId:userId};
}

async function validateUserRefreshAccessJWT(jwt) {
    const jwtPayload = (await validateJWT(jwt, "RefreshToken")).payload
    const userId = jwtPayload.id;
    return {userId:userId};
}

module.exports = {
    createJWT,
    validateJWT,
    createUserAccessJWT,
    createUserRefreshAccessJWT,
    validateUserAccessJWT,
    validateUserRefreshAccessJWT
}