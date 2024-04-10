const fsPromises=require('fs').promises;
const path=require('path');

const {USER_MAP_PATH} = require('../../../config.json');

async function getUserIdByEmail(email) {
    const userMapPath = path.join(__dirname, '../../../', USER_MAP_PATH);
    const userMapObject = JSON.parse(await fsPromises.readFile(userMapPath));

    if(userMapObject[email]){
        return userMapObject[email];
    }else{
        const error = new Error('No user found with this email');
        error.statusCode = 404;
        throw error;
    }
}
module.exports = getUserIdByEmail;