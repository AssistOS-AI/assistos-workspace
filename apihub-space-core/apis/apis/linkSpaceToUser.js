const path = require('path');
const fsPromises = require('fs').promises;
const {USER_FOLDER_PATH} = require('../../config.json');
async function linkSpaceToUser(userId, spaceId) {
    const userFile = path.join(__dirname, '../../../', USER_FOLDER_PATH, `${userId + '.json'}`);
    let userObject;
    let userFileContents;

    try {
        userFileContents = await fsPromises.readFile(userFile, 'utf8');
    } catch(error) {
        error.message =`User ${userId} not found.`;
        error.statusCode = 404;
        throw error;
    }
    try {
        userObject = JSON.parse(userFileContents);
    } catch (error) {
        error.message = `Corrupted user file for userId ${userId}.`
        error.statusCode = 500;
        throw error;
    }
    if (userObject.spaces.some(space => space.id === spaceId)) {
        const error = new Error(`Space ${spaceId} is already linked to user ${userId}.`);
        error.statusCode = 400;
        throw error;
    }

    userObject.spaces.push(spaceId);

    try {
        userObject.currentSpaceId = spaceId;
        await fsPromises.writeFile(userFile, JSON.stringify(userObject, null, 2));
    } catch (error) {
        error.message=`Failed to update user file for userId ${userId}.`;
        error.statusCode = 500;
        throw error;
    }
}

module.exports = linkSpaceToUser;