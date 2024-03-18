const path = require('path');
const fsPromises = require('fs').promises;
const { SPACE_FOLDER_PATH } = require('../../config.json');

async function updateSpaceStatus(spaceId, spaceStatusObject) {
        const spacePath = path.join(__dirname, '../../../', SPACE_FOLDER_PATH, spaceId);
        const spaceStatusPath = path.join(spacePath, 'status', `${spaceId}.json`);
        const dataToWrite = JSON.stringify(spaceStatusObject);
        await fsPromises.writeFile(spaceStatusPath, dataToWrite, { encoding: 'utf8' });
}

module.exports = updateSpaceStatus;
