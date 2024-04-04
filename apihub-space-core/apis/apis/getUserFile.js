const path = require('path');
const fsPromises = require('fs').promises;
const getUserFilePath = require('../exporter.js')('getUserFilePath');

async function getUserFile(userId) {
    const userFilePath = await getUserFilePath(userId)
    try {
        await fsPromises.access(userFilePath);
    } catch (e) {
        const error = new Error(`User with id ${userId} does not exist`);
        error.statusCode = 404;
        throw error;
    }
    let userFile = await fsPromises.readFile(userFilePath, 'utf8');
    return userFile;
}

module.exports = getUserFile;