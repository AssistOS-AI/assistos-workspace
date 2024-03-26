const path = require('path');
const fsPromises = require('fs').promises;
const {
    getCurrentUTCDate,
    generateId,
    templateReplacer_$$,
    generateVerificationToken,
    hashPassword,
    incrementDate
} = require('../exporter.js')
('getCurrentUTCDate', 'generateId', 'templateReplacer_$$', 'generateVerificationToken', 'hashPassword', 'incrementDate')

const userRegistrationTemplate = require('../../models/templates/exporter.js')
('userRegistrationTemplate');

const {USER_PENDING_ACTIVATION_PATH,USER_MAP_PATH} = require('../../config.json');

async function registerUser(name, email, password) {

    const currentDate = getCurrentUTCDate();
    const registrationUserObject = templateReplacer_$$(userRegistrationTemplate, {
        email: email,
        name: name,
        passwordHash: await hashPassword(password),
        verificationToken: await generateVerificationToken(),
        verificationTokenExpirationDate: incrementDate(currentDate, {minutes: 5}),
        currentDate: currentDate,
    })
    const userMapFilePath = path.join(__dirname, '../../../', USER_MAP_PATH);
    const userMapObject = JSON.parse(await fsPromises.readFile(userMapFilePath));
    if (userMapObject[email]) {
        const error = new Error(`User with email ${email} already exists`);
        error.statusCode = 409;
        throw error;
    }

    const userPendingActivationFilePath = path.join(__dirname, '../../../', USER_PENDING_ACTIVATION_PATH);
    const userPendingActivationObject = JSON.parse(await fsPromises.readFile(userPendingActivationFilePath));
    userPendingActivationObject[registrationUserObject.verificationToken] = registrationUserObject
    await fsPromises.writeFile(userPendingActivationFilePath, JSON.stringify(userPendingActivationObject, null, 2));
}

module.exports = registerUser
