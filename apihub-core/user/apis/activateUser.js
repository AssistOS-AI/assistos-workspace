const path = require('path');
const fsPromises = require('fs').promises;
const {
    createUser,
    isActivationTokenExpired,
    getCurrentUTCDate
} = require('../../exporter.js')('createUser', 'isActivationTokenExpired', 'getCurrentUTCDate');
const {USER_PENDING_ACTIVATION_PATH, USER_MAP_PATH, USER_CREDENTIALS_PATH} = require('../../../config.json');

async function activateUser(activationToken) {
    const userPendingActivationFilePath = path.join(__dirname, '../../../', USER_PENDING_ACTIVATION_PATH);
    const userPendingActivationObject = JSON.parse(await fsPromises.readFile(userPendingActivationFilePath));
    if (!userPendingActivationObject[activationToken]) {
        const error = new Error('Invalid activation token');
        error.statusCode = 404;
        throw error;
    }

    if (isActivationTokenExpired(userPendingActivationObject[activationToken].verificationTokenExpirationDate)) {
        delete userPendingActivationObject[activationToken]
        await fsPromises.writeFile(userPendingActivationFilePath, JSON.stringify(userPendingActivationObject, null, 2), 'utf8');
        const error = new Error('Token Activation Expired');

        error.statusCode = 404;
        throw error;
    }

    const userData = userPendingActivationObject[activationToken];
    try {
        const userDataObject = await createUser(userData.name, userData.email, true);
        const userMapPath = path.join(__dirname, '../../../', USER_MAP_PATH);
        const userMapObject = JSON.parse(await fsPromises.readFile(userMapPath));
        userMapObject[userData.email] = userDataObject.id;
        await fsPromises.writeFile(userMapPath, JSON.stringify(userMapObject, null, 2), 'utf8');
        const userCredentialsPath = path.join(__dirname, '../../../', USER_CREDENTIALS_PATH);
        const userCredentialsObject = JSON.parse(await fsPromises.readFile(userCredentialsPath));
        userCredentialsObject[userDataObject.id] = userData;
        userCredentialsObject[userDataObject.id].activationDate = getCurrentUTCDate();
        await fsPromises.writeFile(userCredentialsPath, JSON.stringify(userCredentialsObject, null, 2), 'utf8');
        return userDataObject;
    } catch (error) {
        throw error;
    } finally {
        delete userPendingActivationObject[activationToken]
        await fsPromises.writeFile(userPendingActivationFilePath, JSON.stringify(userPendingActivationObject, null, 2), 'utf8');
    }
}

module.exports = activateUser
