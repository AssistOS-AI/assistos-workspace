const {USER_FOLDER_PATH} = require('../../../config.json');
const path= require('path');

function getUserFilePath(userId) {
    return path.join(__dirname, '../../../', USER_FOLDER_PATH, `${userId + '.json'}`);
}
module.exports=getUserFilePath;
