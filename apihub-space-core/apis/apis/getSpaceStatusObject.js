const path = require('path');
const fsPromises = require('fs').promises;
const {SPACE_FOLDER_PATH} = require('../../config.json');

async function getSpaceStatusObject(spaceId) {
    const spacePath = path.join(__dirname, '../../../', `${SPACE_FOLDER_PATH}`, `${spaceId}`);
    const spaceStatusPath = path.join(spacePath, 'status', `${spaceId + '.json'}`);
    const spaceObjectJsonString=await fsPromises.readFile(spaceStatusPath, {encoding: 'utf8'});
    const spaceStatusObject = JSON.parse(spaceObjectJsonString);
    return spaceStatusObject
}

module.exports = getSpaceStatusObject;
