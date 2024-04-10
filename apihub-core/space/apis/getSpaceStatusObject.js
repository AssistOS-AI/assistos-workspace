const path = require('path');
const fsPromises = require('fs').promises;
const {SPACE_FOLDER_PATH} = require('../../../config.json');

async function getSpaceStatusObject(spaceId) {
    const spacePath = path.join(__dirname, '../../../', `${SPACE_FOLDER_PATH}`, `${spaceId}`);
    const spaceStatusPath = path.join(spacePath, 'status', `status.json`);
    let spaceObjectJsonString = "";
    try {
        spaceObjectJsonString = await fsPromises.readFile(spaceStatusPath, {encoding: 'utf8'});
    } catch (error) {
        error.message = `Space ${spaceId} not found.`;
        error.statusCode = 404;
        throw error;
    }
    let spaceStatusObject = {};
    try {
        spaceStatusObject = JSON.parse(spaceObjectJsonString);
    } catch (error) {
        error.message = `Corrupted space file for Space: ${spaceId}.`;
        error.statusCode = 500;
        throw error;
    }
    return spaceStatusObject
}

module.exports = getSpaceStatusObject;
