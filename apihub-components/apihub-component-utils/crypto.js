const crypto = require("opendsu").loadAPI("crypto");

const DEFAULT_ID_LENGTH = 16
const DEFAULT_SECRET_LENGTH = 64;

function generateId(length = DEFAULT_ID_LENGTH) {
    let random = crypto.getRandomSecret(length);
    let randomStringId = "";
    while (randomStringId.length < length) {
        randomStringId = crypto.encodeBase58(random).slice(0, length);
    }
    return randomStringId;
}

function generateSecret(length = DEFAULT_SECRET_LENGTH) {
    return crypto.getRandomSecret(length);
}

module.exports = {
    generateSecret,
    generateId,
}
