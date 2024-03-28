const fsPromises = require('fs').promises;
const path = require('path');
const {
    generateId,
    templateReplacer_$$,
    createSpace,
    getCurrentUTCDate,
    deleteSpace
} = require('../exporter.js')
('generateId', 'templateReplacer_$$', 'createSpace', 'getCurrentUTCDate', 'deleteSpace');

const {defaultUserTemplate, defaultSpaceNameTemplate} = require('../../models/templates/exporter.js')
('defaultUserTemplate', 'defaultSpaceNameTemplate');

const {USER_FOLDER_PATH, USER_CREDENTIALS_PATH} = require('../../config.json');


async function createUser(username, email, withDefaultSpace = false) {
    const rollback = async () => {
        try {
            await fsPromises.rm(userPath, {recursive: true, force: true});
        } catch (error) {
            throw error;
        }
        if (withDefaultSpace) {
            deleteSpace(userData.currentSpaceId)
        }
    }

    const userId = generateId();
    const spaceName = templateReplacer_$$(
        defaultSpaceNameTemplate,
        {
            username: username.endsWith('s') ? username + "'" : username + "'s"
        }
    )
    const userData = templateReplacer_$$(defaultUserTemplate,
        {
            id: userId,
            username: username,
            email: email,
        }
    )

    const userPath = path.join(__dirname, '../../../', USER_FOLDER_PATH, `${userId}.json`);
    try {
        await fsPromises.writeFile(userPath, JSON.stringify(userData, null, 2), 'utf8');
        if (withDefaultSpace) {
            const createdSpaceId = (await createSpace(spaceName, userId)).id;
            userData.currentSpaceId = createdSpaceId
            userData.spaces.push(createdSpaceId);
            await fsPromises.writeFile(userPath, JSON.stringify(userData, null, 2), 'utf8');
        }
        return userData;
    } catch (error) {
        error.message = 'Error creating user';
        error.statusCode = 500;
        await rollback();
        throw error;
    }
}


module.exports = createUser