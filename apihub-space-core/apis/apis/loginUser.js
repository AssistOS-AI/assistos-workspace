const fsPromises = require('fs').promises;
const path = require('path');

const {getUserIdByEmail, hashPassword} = require('../exporter.js')
('getUserIdByEmail', 'hashPassword')
const {USER_CREDENTIALS_PATH} = require('../../config.json')

async function loginUser(email, password) {

    let userId = null;
    try {
        userId = await getUserIdByEmail(email)
    } catch (error) {
        if (error.statusCode === 404) {
            error.message = 'Invalid email or password';
            error.statusCode = 404;
            throw error;
        }
        throw error;
    }
    const userCredentialsPath = path.join(__dirname, '../../../', USER_CREDENTIALS_PATH);
    const usersCredentialsObject = JSON.parse(await fsPromises.readFile(userCredentialsPath));
    if(usersCredentialsObject[userId].password === await hashPassword(password)){
        return {
            success: true,
            userId:userId
        }
    }else{
        return {
            success: false,
            message: 'Invalid email or password'
        }
    }
}

module.exports = loginUser