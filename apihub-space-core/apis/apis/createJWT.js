const securityConfig = require('../../securityConfig.json');
const crypto = require('opendsu').loadAPI('crypto');
const {SERVER_ROOT_FOLDER}=require('../../config.json')

const map={
    SHA256:crypto.sha256,
}

async function createJWT(payload, secret=securityConfig.JWT.secret) {
    debugger
    const crypto = require("pskcrypto");
    const header = {
        alg: securityConfig.JWT.algorithm,
        type: securityConfig.JWT.type
    };
    const encodedHeader=crypto.base64UrlEncodeJOSE(header);
    const encodedPayload=crypto.base64UrlEncodeJOSE(payload);

    const signatureBase=encodedHeader+"."+encodedPayload;

    const encodedSignature=map[securityConfig.jwt.algorithm]();

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

}
module.exports = createJWT;