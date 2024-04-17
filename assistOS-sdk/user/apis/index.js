const fsPromises = require('fs').promises;
const path= require('path')

const Loader = require('../../index.js')

const config = Loader.loadModule('config')
const utilsModule = Loader.loadModule('util')
const {crypto, date, data} = utilsModule.loadAPIs('crypto', 'date', 'data')
const spaceModule = Loader.loadModule('space')
const userModule= Loader.loadModule('user')

async function activateUser(activationToken) {
    const userPendingActivation = await getUserPendingActivation()
    if (!userPendingActivation[activationToken]) {
        const error = new Error('Invalid activation token');
        error.statusCode = 404;
        throw error;
    }
    if (date.compareUTCDates(userPendingActivation[activationToken].verificationTokenExpirationDate, date.getCurrentUTCDate()) < 0) {
        delete userPendingActivation[activationToken]
        await updateUserPendingActivation(userPendingActivation)
        const error = new Error('Token Activation Expired');
        error.statusCode = 404;
        throw error;
    }

    const user = userPendingActivation[activationToken];
    try {
        const userDataObject = await createUser(user.name, user.email, true);
        const userMap = await getUserMap();
        userMap[user.email] = userDataObject.id;
        await updateUserMap(userMap);

        const userCredentials = await getUserCredentials();
        userCredentials[userDataObject.id] = user;
        userCredentials[userDataObject.id].activationDate = date.getCurrentUTCDate();
        await updateUserCredentials(userCredentials);

        return userDataObject;
    } catch (error) {
        throw error;
    } finally {
        delete userPendingActivation[activationToken]
        await updateUserPendingActivation(userPendingActivation);
    }
}

async function addSpaceCollaborator(spaceId, userId, role) {
    await linkSpaceToUser(userId, spaceId)
    try {
        await linkUserToSpace(spaceId, userId, role)
    } catch (error) {
        await unlinkSpaceFromUser(userId, spaceId);
        throw error;
    }
}

async function createDemoUser() {
    const {username, email, password} = userModule.loadData('templates').demoUser
    await registerUser(username, email, crypto.hashPassword(password))
    const userPendingActivation = await getUserPendingActivation()
    const activationToken = Object.keys(userPendingActivation)[0]
    await activateUser(activationToken)
}

async function createUser(username, email, withDefaultSpace = false) {
    const spaceAPIs = spaceModule.loadAPIs()
    const spaceData = spaceModule.loadData('templates')
    const userData= userModule.loadData('templates')
    const rollback = async () => {
        await fsPromises.rm(userPath, {recursive: true, force: true});
        if (withDefaultSpace) {
            await spaceAPIs.deleteSpace(userData.currentSpaceId)
        }
    }

    const userId = crypto.generateId();
    const spaceName = data.fillTemplate(
        spaceData.defaultSpaceNameTemplate,
        {
            username: username.endsWith('s') ? username + "'" : username + "'s"
        }
    )
    const user = data.fillTemplate(userData.defaultUserTemplate,
        {
            id: userId,
            username: username,
            email: email,
        }
    )

    const userPath = getUserFilePath(userId)
    try {
        await updateUserFile(userId, user)
        if (withDefaultSpace) {
            const createdSpaceId = (await spaceAPIs.createSpace(spaceName, userId)).id;
            user.currentSpaceId = createdSpaceId
            user.spaces.push(createdSpaceId);
        }
        await updateUserFile(userId, user)
        return user;
    } catch (error) {
        await rollback();
        throw error;
    }
}

async function getActivationFailHTML(failReason) {
    const emailData = await Loader.loadModule('services').loadServices('email').data
    let redirectURL = config.ENVIRONMENT_MODE === 'development' ? config.DEVELOPMENT_BASE_URL : config.PRODUCTION_BASE_URL
    return data.fillTemplate(emailData.templates.activationFailTemplate, {
        redirectURL: redirectURL,
        failReason: failReason
    })
}

async function getActivationSuccessHTML() {
    const emailData = await Loader.loadModule('services').loadServices('email').data
    let loginRedirectURL = config.ENVIRONMENT_MODE === 'development' ? config.DEVELOPMENT_BASE_URL : config.PRODUCTION_BASE_URL
    return data.fillTemplate(emailData.templates.activationSuccessTemplate, {
        loginRedirectURL: loginRedirectURL
    })
}

async function getUserData(userId) {
    const spaceAPIs = spaceModule.loadAPIs()
    const userFile = await getUserFile(userId)
    const spacesMap = await spaceAPIs.getSpaceMap();
    userFile.spaces = userFile.spaces.map(space => {
        return {
            name: spacesMap[space],
            id: space
        };
    });
    return userFile;
}

async function getUserIdByEmail(email) {
    const userMap = await getUserMap()
    if (userMap[email]) {
        return userMap[email];
    } else {
        const error = new Error('No user found with this email');
        error.statusCode = 404;
        throw error;
    }
}

async function linkSpaceToUser(userId, spaceId) {
    const userFile = await getUserFile(userId)

    if (userFile.spaces.some(space => space.id === spaceId)) {
        const error = new Error(`Space ${spaceId} is already linked to user ${userId}.`);
        error.statusCode = 400;
        throw error;
    }
    userFile.spaces.push(spaceId);
    userFile.currentSpaceId = spaceId;
    await updateUserFile(userId, userFile);

}

async function linkUserToSpace(spaceId, userId, role) {
    const spaceAPIs = spaceModule.loadAPIs()
    const spaceStatusObject = await spaceAPIs.getSpaceStatusObject(spaceId);
    if (!spaceStatusObject.users || !Array.isArray(spaceStatusObject.users)) {
        const error = new Error(`Corrupted Space file for Space: ${spaceStatusObject.name}`);
        error.statusCode = 500;
        throw error;
    }
    if (!spaceStatusObject.users.find(user => user.userId === userId)) {
        spaceStatusObject.users.push(
            {
                userId: userId,
                role: role,
                joinDate: date.getCurrentUTCDate()
            }
        )
    } else {
        const error = new Error(`User is already member of the Space: ${spaceStatusObject.name}`);
        error.statusCode = 409
        throw error
    }
    await spaceAPIs.updateSpaceStatus(spaceId, spaceStatusObject);
}

async function loginUser(email, password) {
    const userId = await getUserIdByEmail(email).catch(() => {
        throw new Error('Invalid credentials');
    });

    const userCredentials = await getUserCredentials();
    const hashedPassword = crypto.hashPassword(password);
    if (userCredentials[userId].password === hashedPassword) {
        return userId;
    }

    throw new Error('Invalid credentials');
}

async function registerUser(name, email, password) {
    const currentDate = date.getCurrentUTCDate();
    const userData = userModule.loadData('templates')
    const registrationUserObject = data.fillTemplate(userData.userRegistrationTemplate, {
        email: email,
        name: name,
        passwordHash: crypto.hashPassword(password),
        verificationToken: await crypto.generateVerificationToken(),
        verificationTokenExpirationDate: date.incrementUTCDate(currentDate, {minutes: 30}),
        currentDate: currentDate,
    })
    const userMap = await getUserMap()
    if (userMap[email]) {
        const error = new Error(`User with email ${email} already exists`);
        error.statusCode = 409;
        throw error;
    }

    const userPendingActivation = await getUserPendingActivation()
    userPendingActivation[registrationUserObject.verificationToken] = registrationUserObject
    await updateUserPendingActivation(userPendingActivation)
    await sendActivationEmail(email, name, registrationUserObject.verificationToken);
}

async function sendActivationEmail(emailAddress, username, activationToken) {
    const emailService = Loader.loadModule('services').loadServices('email').service.getInstance()
    await emailService.sendActivationEmail(emailAddress, username, activationToken);
}

async function unlinkSpaceFromUser(userId, spaceId) {
    const userFile = await getUserFile(userId)

    const spaceIndex = userFile.spaces.findIndex(space => space.id === spaceId);
    if (spaceIndex === -1) {
        return;
    }

    userFile.spaces.splice(spaceIndex, 1);

    if (userFile.currentSpaceId === spaceId) {
        delete userFile.currentSpaceId;
    }
    await updateUserFile(userId, userFile)
}

function getUserPendingActivationPath() {
    return Loader.getStorageVolumePaths('userPendingActivation')
}

async function getUserPendingActivation() {
    const userPendingActivationPath = getUserPendingActivationPath();
    try {
        await fsPromises.access(userPendingActivationPath);
    } catch (error) {
        error.message = 'User pending activation not found';
        error.statusCode = 404;
        throw error;
    }
    const userPendingActivation = await fsPromises.readFile(userPendingActivationPath, 'utf8');
    return JSON.parse(userPendingActivation);
}

async function updateUserPendingActivation(userPendingActivationObject) {
    await fsPromises.writeFile(getUserPendingActivationPath(), JSON.stringify(userPendingActivationObject, null, 2));
}

function getUserCredentialsPath() {
    return Loader.getStorageVolumePaths('userCredentials')
}

async function getUserCredentials() {
    const userCredentialsPath = getUserCredentialsPath();
    try {
        await fsPromises.access(userCredentialsPath);
    } catch (error) {
        error.message = 'User credentials not found';
        error.statusCode = 404;
        throw error;
    }
    const userCredentials = await fsPromises.readFile(userCredentialsPath, 'utf8');
    return JSON.parse(userCredentials);
}

async function updateUserCredentials(userCredentialsObject) {
    await fsPromises.writeFile(getUserCredentialsPath(), JSON.stringify(userCredentialsObject, null, 2));
}

function getUserMapPath() {
    return Loader.getStorageVolumePaths('userMap')
}

async function getUserMap() {
    const userMapPath = getUserMapPath();
    try {
        await fsPromises.access(userMapPath);
    } catch (error) {
        error.message = 'User map not found';
        error.statusCode = 404;
        throw error;
    }
    const userMap = await fsPromises.readFile(userMapPath, 'utf8');
    return JSON.parse(userMap);
}

async function updateUserMap(userMapObject) {
    await fsPromises.writeFile(getUserMapPath(), JSON.stringify(userMapObject, null, 2));
}

function getUserFilePath(userId) {
    return path.join(Loader.getStorageVolumePaths('user'), `${userId}.json`);
}

async function getUserFile(userId) {
    const userFilePath = await getUserFilePath(userId)
    try {
        await fsPromises.access(userFilePath);
    } catch (e) {
        const error = new Error(`User with id ${userId} does not exist`);
        error.statusCode = 404;
        throw error;
    }
    let userFile = await fsPromises.readFile(userFilePath, 'utf8');
    return JSON.parse(userFile);
}

async function updateUserFile(userId, userObject) {
    await fsPromises.writeFile(getUserFilePath(userId), JSON.stringify(userObject, null, 2), 'utf8', {encoding: 'utf8'});
}

async function updateUsersCurrentSpace(userId, spaceId) {
    const userFile = await getUserFile(userId);
    userFile.currentSpaceId = spaceId;
    await updateUserFile(userId, userFile);
}
async function getDefaultSpaceId(userId) {
    const userFile = await getUserFile(userId)
    return userFile.currentSpaceId;
}

module.exports = {
    activateUser,
    addSpaceCollaborator,
    createDemoUser,
    createUser,
    getActivationFailHTML,
    getActivationSuccessHTML,
    getUserData,
    getUserFile,
    getUserFilePath,
    getUserIdByEmail,
    linkSpaceToUser,
    linkUserToSpace,
    loginUser,
    registerUser,
    sendActivationEmail,
    unlinkSpaceFromUser,
    updateUserFile,
    updateUsersCurrentSpace,
    getDefaultSpaceId
}
