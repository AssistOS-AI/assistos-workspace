const crypto = require("opendsu").loadAPI("crypto");

const {DEFAULT_ID_LENGTH} = require('../constants/exporter.js')('utils-constants');

function generateId(length = DEFAULT_ID_LENGTH) {
    let random = crypto.getRandomSecret(length);
    let randomStringId = "";
    while (randomStringId.length < length) {
        randomStringId = crypto.encodeBase58(random).slice(0, length);
    }
    return randomStringId;
}

async function generateVerificationToken() {
    return await crypto.getRandomSecret(64);
}

function generateSecret(length = DEFAULT_SECRET_LENGTH) {
    return crypto.getRandomSecret(length);
}

function hashPassword(password) {
    /* TODO Use a more secure hashing algorithm */
    return Array.from(crypto.sha256JOSE(password))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

const {SERVER_ROOT_FOLDER} = require('../../config.json')

async function invalidateAndRegenerateSecrets() {
    const apihub = require('apihub');
    const secretsService = await apihub.getSecretsServiceInstanceAsync(SERVER_ROOT_FOLDER);
    await secretsService.putSecretAsync("default", "apjfghjihub", {abc: "apihjhfgjfub"});
}

module.exports = hashPassword
module.exports = generateVerificationToken
module.exports = generateId