const path = require('path');
const fsPromises = require('fs').promises;
const {USER_FOLDER_PATH} = require('../../config.json');

async function updateUserFile(userId,userObject) {
    const userFile = path.join(__dirname, '../../../', USER_FOLDER_PATH, `${userId + '.json'}`);
    await fsPromises.writeFile(userFile,userObject,'utf8',{encoding: 'utf8'});
}
module.exports= updateUserFile;