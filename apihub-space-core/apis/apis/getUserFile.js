const path = require('path');
const fsPromises = require('fs').promises;
const {USER_FOLDER_PATH} = require('../../config.json');

async function getUserFile(userId) {
    const userFilePath = path.join(__dirname, '../../../', USER_FOLDER_PATH, `${userId + '.json'}`);
    if(!fsPromises.access(userFilePath)){
        throw new Error(`User with id ${userId} does not exist`);
    }
    let userFile=await fsPromises.readFile(userFilePath, 'utf8');
    return userFile;
}
module.exports= getUserFile;