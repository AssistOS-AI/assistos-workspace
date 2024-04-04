const crypto = require('opendsu').loadAPI('crypto');
const createJWT = require('../exporter.js')('createJWT');

async function createUserJWT(userData) {
    const JWT = await createJWT(userData);
    return userData.id

}

module.exports = createUserJWT