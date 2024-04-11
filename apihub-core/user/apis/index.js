const fsPromises = require('fs').promises;
const Loader = require('../../Loader.js')

const config = Loader.loadModule('config')
const crypto = Loader.loadModule('util', 'crypto')
const data = Loader.loadModule('util', 'data')
const date = Loader.loadModule('util', 'date')
const email= Loader.loadModule('services', 'email')
async function activateUser(activationToken) {
    const userPendingActivation= await getUserPendingActivation()
    if (!userPendingActivation[activationToken]) {
        const error = new Error('Invalid activation token');
        error.statusCode = 404;
        throw error;
    }
    if (isActivationTokenExpired(userPendingActivationObject[activationToken].verificationTokenExpirationDate)) {
        delete userPendingActivationObject[activationToken]
        await fsPromises.writeFile(userPendingActivation, JSON.stringify(userPendingActivationObject, null, 2), 'utf8');
        const error = new Error('Token Activation Expired');

        error.statusCode = 404;
        throw error;
    }

    const userData = userPendingActivationObject[activationToken];
    try {
        const userDataObject = await createUser(userData.name, userData.email, true);
        const userMapObject = JSON.parse(await fsPromises.readFile(userMap));
        userMapObject[userData.email] = userDataObject.id;
        await fsPromises.writeFile(userMap, JSON.stringify(userMapObject, null, 2), 'utf8');

        const userCredentialsObject = JSON.parse(await fsPromises.readFile(userCredentials));
        userCredentialsObject[userDataObject.id] = userData;
        userCredentialsObject[userDataObject.id].activationDate = getCurrentUTCDate();
        await fsPromises.writeFile(userCredentials, JSON.stringify(userCredentialsObject, null, 2), 'utf8');

        return userDataObject;
    } catch (error) {
        throw error;
    } finally {
        delete userPendingActivationObject[activationToken]
        await fsPromises.writeFile(userPendingActivation, JSON.stringify(userPendingActivationObject, null, 2), 'utf8');
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
    const {username, email, password} = Loader.loadModule('user', 'data').demoUser
    await registerUser(username, email, crypto.hashPassword(password))
    const usersPendingActivation = await JSON.parse(await fsPromises.readFile(userPendingActivation, 'utf8'));
    const activationToken = Object.keys(usersPendingActivation)[0]
    await activateUser(activationToken)
}


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


async function getActivationFailHTML(failReason) {
    let redirectURL = config.ENVIRONMENT_MODE === 'development' ? config.DEVELOPMENT_BASE_URL : config.PRODUCTION_BASE_URL
    return data.fillTemplate(user.data.activationSuccessTemplate, {
        redirectURL: redirectURL,
        failReason: failReason
    })
}

async function getActivationSuccessHTML() {
    let loginRedirectURL = config.ENVIRONMENT_MODE === 'development' ? config.DEVELOPMENT_BASE_URL : config.PRODUCTION_BASE_URL
    return data.fillTemplate(activationSuccessTemplate, {
        loginRedirectURL: loginRedirectURL
    })
}


async function getUserData(userId) {
    const userFile = JSON.parse(await getUserFile(userId));
    const spacesMap = await getSpacesMap();
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
    const userFile = path.join(__dirname, '../../../', USER_FOLDER_PATH, `${userId + '.json'}`);
    let userObject;
    let userFileContents;

    try {
        userFileContents = await fsPromises.readFile(userFile, 'utf8');
    } catch (error) {
        error.message = `User ${userId} not found.`;
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
        error.message = `Failed to update user file for userId ${userId}.`;
        error.statusCode = 500;
        throw error;
    }
}


async function linkUserToSpace(spaceId, userId, role) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
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
                joinDate: getCurrentUTCDate()
            }
        )
    } else {
        const error = new Error(`User is already member of the Space: ${spaceStatusObject.name}`);
        error.statusCode = 409
        throw error
    }
    await updateSpaceStatus(spaceId, spaceStatusObject);
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
    const registrationUserObject = data.fillTemplate(user.data.userRegistrationTemplate, {
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
    await EmailService.getInstance().sendActivationEmail(emailAddress, username, activationToken);
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
    updateUsersCurrentSpace
}
