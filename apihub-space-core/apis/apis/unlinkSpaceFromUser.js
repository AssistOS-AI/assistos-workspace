const path = require('path');
const fsPromises = require('fs').promises;
const {USER_FOLDER_PATH} = require('../../config.json');

async function unlinkSpaceFromUser(userId, spaceId) {
    const userFile = path.join(__dirname, '../../../', USER_FOLDER_PATH, `${userId}.json`);
    let userObject;
    try {
        const userFileContents = await fsPromises.readFile(userFile, 'utf8');
        userObject = JSON.parse(userFileContents);
    } catch (error) {
        if (error.code === 'ENOENT') {
            error.message = `User ${userId} not found.`;
            error.statusCode = 404;
        } else {
            error.message = `Failed to read or parse user file for userId ${userId}.`;
            error.statusCode = 500;
        }
        throw error;
    }

    const spaceIndex = userObject.spaces.findIndex(space => space.id === spaceId);
    if (spaceIndex === -1) {
        return;
    }

    userObject.spaces.splice(spaceIndex, 1);

    if (userObject.currentSpaceId === spaceId) {
        delete userObject.currentSpaceId;
    }

    try {
        await fsPromises.writeFile(userFile, JSON.stringify(userObject, null, 2));
    } catch (error) {
        error.message = `Failed to update user file for userId ${userId}.`;
        error.statusCode = 500;
        throw error;
    }
}

module.exports = unlinkSpaceFromUser;
