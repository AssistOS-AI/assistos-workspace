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

async function createUserJWT(userData) {
    const payloadData = {
        id: userData.id,
        role: "user"
    }
    const accessToken = await createJWT(payloadData,"AccessTokens");
    const refreshToken = await createJWT(payloadData,"RefreshTokens");
    return [accessToken, refreshToken]

}

module.exports={
    createJWT,
    validateJWT,
    createUserJWT
}