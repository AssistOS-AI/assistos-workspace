const JWTConfigs = require('../../../apihub-core/securityModule.json').JWT;
const crypto = require('opendsu').loadAPI('crypto');


const {getCurrentUnixTime, incrementUnixTime} = require('../../apihub-core/exporter.js')
('getCurrentUnixTime', 'incrementUnixTime')


async function createJWT(payloadData, jwtType) {

    if (!JWTConfigs[jwtType]) {
        throw new Error(`Invalid JWT type: ${jwtType}`);
    }

    const jwtConfig = JWTConfigs[jwtType];

    const payload = {
        ...payloadData,
        iat: getCurrentUnixTime(),
        exp: incrementUnixTime(getCurrentUnixTime(), jwtConfig.expiresIn),
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
    const accessToken = await createJWT(payloadData,"AccessTokens");
    return accessToken

}
async function createUserRefreshAccessJWT(userData){
    const payloadData = {
        id: userData.id,
        role: "user"
    }
    const refreshToken = await createJWT(payloadData,"RefreshTokens");
    return refreshToken
}
async function validateUserAccessJWT(jwt){
    const jwtPayload = (await validateJWT(jwt,"AccessToken")).payload
    const userId=jwtPayload.id;
    return userId;
}
async function validateUserRefreshAccessJWT(jwt){
    const jwtPayload = (await validateJWT(jwt,"RefreshToken")).payload
    const userId=jwtPayload.id;
    return userId;
}

module.exports={
    createJWT,
    validateJWT,
    createUserAccessJWT,
    createUserRefreshAccessJWT,
    validateUserAccessJWT,
    validateUserRefreshAccessJWT
}