const path = require('path');
const fsPromises = require('fs').promises;
const { SPACE_FOLDER_PATH } = require('../../../config.json');

async function updateSpaceStatus(spaceId, spaceStatusObject) {
        const spacePath = path.join(__dirname, '../../../', SPACE_FOLDER_PATH, spaceId);
        const spaceStatusPath = path.join(spacePath, 'status', `status.json`);
        const spaceStatusJson = JSON.stringify(spaceStatusObject);
        await fsPromises.writeFile(spaceStatusPath, spaceStatusJson, { encoding: 'utf8' });
}

module.exports = updateSpaceStatus;
