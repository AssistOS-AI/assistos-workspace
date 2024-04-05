//require('../../../opendsu-sdk/builds/output/openDSU.js');
const JWTConfigs = require('../../securityModule.js').JWT;
const crypto = require('opendsu').loadAPI('crypto');
const pskCrypto = require("pskcrypto");

const {getCurrentUnixTime, incrementUnixTime} = require('../exporter.js')
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
    const testKey = {
        "kty": "oct",
        "k": "573b586be32639707c81138d1b869afec8bc0647a8f7a5de1fac6cccae07aa666864b19bb95fde4c96d9d4848fb38bc2ea70346cac57f453270a8ec5e0855411",
        "alg": "HS256",
        "kid": "2011-04-29"
    }
    const encodedSignature = crypto.joseAPI.sign(payload, jwtConfig.secret,{keyid:"2011-04-29"});
    const decodedToken = crypto.joseAPI.decode(encodedSignature);
    const encodedPayload = crypto.joseAPI.verify(encodedSignature, testKey);

    return encodedSignature;
}

/*(async () => {
    await createJWT({name: 'John Doe'}, 'AccessTokens')
})();*/
module.exports = createJWT;