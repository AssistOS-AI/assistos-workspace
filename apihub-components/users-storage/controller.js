const cookie = require('../apihub-component-utils/cookie.js');
const utils = require('../apihub-component-utils/utils.js');
const fsPromises = require('fs').promises;
const crypto = require('../apihub-component-utils/crypto.js');
const data = require('../apihub-component-utils/data.js');
const date = require('../apihub-component-utils/date.js');
async function registerUser(request, response) {
    const userData = request.body;
    if(!userData.name){
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Name is required"
        });
    }
    if(!userData.email){
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Email is required"
        });
    }
    if(!userData.password){
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Password is required"
        });
    }
    try {
        await registerUserImpl(
            userData.name,
            userData.email,
            userData.password);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `User ${userData.name} registered successfully. Please check your email for the verification code`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
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
function getUserPendingActivationPath() {
    return require('../../data-volume/config.json').USER_PENDING_ACTIVATION_PATH;
}
async function loginUserImpl(email, password) {
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
async function registerUserImpl(name, email, password) {
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
async function activateUserImpl(activationToken) {
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
async function getActivationSuccessHTML() {
    const emailData = await Loader.loadModule('services').loadServices('email').data
    let loginRedirectURL = config.ENVIRONMENT_MODE === 'development' ? config.DEVELOPMENT_BASE_URL : config.PRODUCTION_BASE_URL
    return data.fillTemplate(emailData.templates.activationSuccessTemplate, {
        loginRedirectURL: loginRedirectURL
    })
}
async function getActivationFailHTML(failReason) {
    const emailData = await Loader.loadModule('services').loadServices('email').data
    let redirectURL = config.ENVIRONMENT_MODE === 'development' ? config.DEVELOPMENT_BASE_URL : config.PRODUCTION_BASE_URL
    return data.fillTemplate(emailData.templates.activationFailTemplate, {
        redirectURL: redirectURL,
        failReason: failReason
    })
}
async function activateUser(request, response) {

    const queryParams = utils.extractQueryParams(request);
    const activationToken = queryParams['activationToken'];
    if (!activationToken) {
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "No activation token provided."
        });
    }
    try {
        await activateUserImpl(activationToken);
        const activationSuccessHTML = await getActivationSuccessHTML();
        await utils.sendFileToClient(response, activationSuccessHTML, "html")
    } catch (error) {
        const activationFailHTML = await getActivationFailHTML(error.message);
        await utils.sendFileToClient(response, activationFailHTML, "html")
    }
}
async function loginUser(request, response) {
    const requestData = request.body;
    try {
        const userId = await loginUserImpl(requestData.email, requestData.password);
        const userData = await getUserData(userId);

        utils.sendResponse(response, 200, "application/json", {
            data: userData,
            success: true,
            message: `User ${userData.name} logged in successfully`
        }, [await cookie.createAuthCookie(userData), await cookie.createRefreshAuthCookie(userData), cookie.createCurrentSpaceCookie(userData.currentSpaceId)]);
    } catch (error) {
        utils.sendResponse(response, 404, "application/json", {
            success: false,
            message: error.message
        });
    }
}
async function loadUser(request, response) {
    try {
        const userAPIs = userModule.loadAPIs();
        const userId = request.userId
        const userData = await userAPIs.getUserData(userId);
        utils.sendResponse(response, 200, "application/json", {
            data: userData,
            success: true,
            message: `User ${userData.name} loaded successfully`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        }, [cookie.createCurrentSpaceCookie(), cookie.createAuthCookie()]);
    }
}
async function logoutUser(request, response) {
    if (!request.userId) {
        return utils.sendResponse(response, 401, "application/json", {
            success: false,
            message: "Unauthorized"
        });
    }
    try {
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: "User logged out successfully"
        }, [cookie.deleteAuthCookie(), cookie.deleteRefreshAuthCookie(), cookie.deleteCurrentSpaceCookie()]);
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}
async function createDemoUser() {
    const {username, email, password} = require('./templates/demoUser.json');
    await registerUserImpl(username, email, crypto.hashPassword(password))
    const userPendingActivation = await getUserPendingActivation()
    const activationToken = Object.keys(userPendingActivation)[0]
    await activateUserImpl(activationToken);
}
module.exports = {
    registerUser,
    activateUser,
    loginUser,
    loadUser,
    logoutUser,
    createDemoUser
};