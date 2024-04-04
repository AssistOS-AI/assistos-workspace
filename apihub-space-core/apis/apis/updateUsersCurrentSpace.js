const fsPromises = require('fs').promises;

const {getUserFile, getUserFilePath} = require('../exporter.js')
('getUserFile', 'getUserFilePath')

async function updateUsersCurrentSpace(userId, spaceId) {
    let userFile = JSON.parse(await getUserFile(userId));
    userFile.currentSpaceId = spaceId;
    const userFilePath = getUserFilePath(userId);
    await fsPromises.writeFile(userFilePath, JSON.stringify(userFile, null, 2));
}

module.exports = updateUsersCurrentSpace