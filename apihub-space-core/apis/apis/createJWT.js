const JWTConfig = require('../../securityConfig.json').JWT;
const crypto = require('opendsu').loadAPI('crypto');

const {getCurrentUnixTime, IncrementUnixTime} = require('../exporter.js')
('getCurrentUnixTime', 'incrementUnixTime')

async function createJWT(payloadData, secret =  JWTConfig.secret) {

    const header = {
        alg:  JWTConfig.algorithm,
        typ:  JWTConfig.typ
    };

    const payload= {
        ...payloadData,
        iat: getCurrentUnixTime(),
        exp: IncrementUnixTime(getCurrentUnixTime(),  JWTConfig.userJWTExpiresIn),
        iss: JWTConfig.issuer,
        aud: JWTConfig.audience
    };

    const pskCrypto = require("pskcrypto");

    const encodedHeader = crypto.base64UrlEncodeJOSE(JSON.stringify(header));
    const encodedPayload = crypto.base64UrlEncodeJOSE(JSON.stringify(payload));

    const signatureBase = encodedHeader + "." + encodedPayload;

    const encodedSignature = pskCrypto.joseAPI.sign(signatureBase,secret);

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

module.exports = createJWT;