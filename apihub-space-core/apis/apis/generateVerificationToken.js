const crypto = require('opendsu').loadAPI('crypto');

async function generateVerificationToken() {
    return await crypto.getRandomSecret(64);
}

module.exports = generateVerificationToken