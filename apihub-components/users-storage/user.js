const fsPromises = require('fs').promises;
const path = require('path');
const crypto = require("../apihub-component-utils/crypto");
const data = require('../apihub-component-utils/data.js');
const date = require('../apihub-component-utils/date.js');
const config = require('../../data-volume/config/config.json')
const volumeManager = require('../volumeManager.js');
const Space = require("../spaces-storage/space");

const AnonymousTask = require('../tasks/AnonymousTask.js');

async function registerUser(email, password, imageId, inviteToken) {
    const currentDate = date.getCurrentUTCDate();
    if(!email && inviteToken){
        const spacePendingInvitationsObj = await Space.APIs.getSpacesPendingInvitationsObject();
        const invitation = spacePendingInvitationsObj[inviteToken];
        email = invitation.email;
    }
    const registrationUserObject ={
        email: email,
        imageId: imageId,
        inviteToken: inviteToken,
        password: crypto.hashPassword(password),
        verificationToken: await crypto.generateVerificationToken(),
        verificationTokenExpirationDate: date.incrementUTCDate(currentDate, {minutes: 30}),
        currentDate: currentDate
    };
    const userMap = await getUserMap()
    if (userMap[email]) {
        const error = new Error(`User with email ${email} already exists`);
        error.statusCode = 409;
        throw error;
    }

    const userPendingActivation = await getUserPendingActivation()
    userPendingActivation[registrationUserObject.verificationToken] = registrationUserObject
    await updateUserPendingActivation(userPendingActivation)
    if (inviteToken) {
        return await activateUser(registrationUserObject.verificationToken);
    }

    if(config.ENABLE_EMAIL_SERVICE){
        await sendActivationEmail(email, registrationUserObject.verificationToken);
    }

    return registrationUserObject.verificationToken
}

async function createUser(email, imageId, withDefaultSpace = false) {
    const Space = require('../spaces-storage/space.js');
    const rollback = async () => {
        await fsPromises.rm(userPath, {recursive: true, force: true});
        if (withDefaultSpace) {
            await Space.APIs.deleteSpace(user.currentSpaceId)
        }
    }

    const userId = crypto.generateId();
    const username = email.split('@')[0];
    const spaceName = data.fillTemplate(
        Space.templates.defaultSpaceNameTemplate,
        {
            username: username.endsWith('s') ? username + "'" : username + "'s"
        }
    )
    const user = {
        id: userId,
        email: email,
        imageId: imageId,
        spaces: {}
    }

    const userPath = getUserFilePath(userId)
    try {
        await updateUserFile(userId, user);
        if (withDefaultSpace) {
            let taskFunction = async function () {
                let spaceModule = await this.loadModule('space');
                const createdSpaceId = (await Space.APIs.createSpace(spaceName, userId, spaceModule)).id;
                user.currentSpaceId = createdSpaceId
                user.spaces[createdSpaceId] = {};
            }
            let task = new AnonymousTask(taskFunction);
            await task.run();
        }
        await updateUserFile(userId, user)
        return user;
    } catch (error) {
        await rollback();
        throw error;
    }
}

async function activateUser(activationToken) {
    const userPendingActivation = await getUserPendingActivation()
    if (!userPendingActivation[activationToken]) {
        throw new Error('Invalid activation token');
    }
    if (date.compareUTCDates(userPendingActivation[activationToken].verificationTokenExpirationDate, date.getCurrentUTCDate()) < 0) {
        delete userPendingActivation[activationToken]
        await updateUserPendingActivation(userPendingActivation)
        throw new Error('Token Activation Expired');
    }

    const user = userPendingActivation[activationToken];
    try {
        const userDataObject = await createUser(user.email, user.imageId, true);
        const userMap = await getUserMap();
        userMap[user.email] = userDataObject.id;
        await updateUserMap(userMap);
        delete user.imageId
        const userCredentials = await getUserCredentials();
        userCredentials[userDataObject.id] = user;
        userCredentials[userDataObject.id].activationDate = date.getCurrentUTCDate();
        await updateUserCredentials(userCredentials);

        let userInvitedSpaceId;
        const spacePendingInvitationsObj = await Space.APIs.getSpacesPendingInvitationsObject();

        for(let token in spacePendingInvitationsObj) {
            const invitation = spacePendingInvitationsObj[token];
            if (invitation.email === user.email) {
                await addSpaceCollaborator(invitation.spaceId, userDataObject.id, invitation.referrerId, [Space.constants.spaceRoles.member]);
                userInvitedSpaceId = spacePendingInvitationsObj[token].spaceId;
                spacePendingInvitationsObj[token].markedForDeletion = true;
            }
        }
        for(let token in spacePendingInvitationsObj) {
            if(spacePendingInvitationsObj[token].markedForDeletion){
                delete spacePendingInvitationsObj[token];
            }
        }
        await Space.APIs.updateSpacePendingInvitations(spacePendingInvitationsObj);
        if(userInvitedSpaceId){
            let userFile = await getUserFile(userDataObject.id);
            userFile.currentSpaceId = userInvitedSpaceId;
            await updateUserFile(userDataObject.id, userFile);
        }

        return userDataObject;
    } catch (error) {
        throw error;
    } finally {
        delete userPendingActivation[activationToken]
        await updateUserPendingActivation(userPendingActivation);
    }
}

async function loginUser(email, password) {
    const userId = await getUserIdByEmail(email);
    const userCredentials = await getUserCredentials();
    const hashedPassword = crypto.hashPassword(password);
    if (userCredentials[userId].password === hashedPassword) {
        return {userId: userId};
    } else {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error
    }
}

async function logoutUser(userId) {
}

async function addSpaceCollaborator(spaceId, userId, role, referrerId) {
    await linkSpaceToUser(userId, spaceId)
    try {
        await linkUserToSpace(spaceId, userId, referrerId, role)
    } catch (error) {
        await unlinkSpaceFromUser(userId, spaceId);
        throw error;
    }
}

async function createDemoUser() {
    const {email, password} = require('./demoUser.json');
    const activationToken = await registerUser(email, crypto.hashPassword(password),'')
    await activateUser(activationToken);
}

async function getUserData(userId) {
    const Space = require('../spaces-storage/space.js');
    const userFile = await getUserFile(userId)
    const spacesMap = await Space.APIs.getSpaceMap();
    userFile.spaces = Object.keys(userFile.spaces).map(spaceId => {
        return {
            name: spacesMap[spaceId],
            id: spaceId,
            data: userFile.spaces[spaceId]
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
async function sendAuthComponentRequest(endpoint, method = "GET", body, headers) {
    let url = `${process.env.BASE_URL}/auth/${endpoint}`;
    let init = {
        method: method,
        headers: headers
    };
    if(method === "POST" || method === "PUT"){
        init.body = JSON.stringify(body);
    }
    let response = await fetch(url, init);
    return await response.json();
}
async function linkSpaceToUser(email, spaceId) {
    let user = await sendAuthComponentRequest(`account/${email}`);
    user.currentSpaceId = spaceId;
    if(!user.spaces){
        user.spaces = [];
    }
    if(user.spaces.includes(spaceId)){
        console.log(`User ${email} is already linked to space ${spaceId}`);
        return;
    }
    user.spaces.push(spaceId);
    await sendAuthComponentRequest(`account/${email}`, 'PUT', user);
}

async function linkUserToSpace(spaceId, userId, referrerId, role) {
    const Space = require('../spaces-storage/space.js');
    const spaceStatusObject = await Space.APIs.getSpaceStatusObject(spaceId);
    if (!spaceStatusObject.users[userId]) {
        spaceStatusObject.users[userId] =
            {
                roles: [role],
                referrerId: referrerId,
                joinDate: date.getCurrentUnixTime()
            }
    } else {
        const error = new Error(`User is already member of the Space: ${spaceStatusObject.name}`);
        error.statusCode = 409
        throw error
    }
    await Space.APIs.updateSpaceStatus(spaceId, spaceStatusObject);
}

function getUserPendingActivationPath() {
    return volumeManager.paths.userPendingActivation
}

async function sendActivationEmail(emailAddress, activationToken) {
    const emailService = require('../email').instance
    await emailService.sendActivationEmail(emailAddress, activationToken);
}

async function unlinkSpaceFromUser(userId, spaceId) {
    const userFile = await getUserFile(userId)

    delete userFile.spaces[spaceId];

    if (userFile.currentSpaceId === spaceId) {
        let spaces = Object.keys(userFile.spaces);
        userFile.currentSpaceId = spaces.length > 0 ? spaces[0] : null;
    }
    await updateUserFile(userId, userFile);
}

async function updateUserPendingActivation(userPendingActivationObject) {
    await fsPromises.writeFile(getUserPendingActivationPath(), JSON.stringify(userPendingActivationObject, null, 2));
}

function getUserCredentialsPath() {
    return volumeManager.paths.userCredentials
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
    return volumeManager.paths.userMap
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
    return path.join(volumeManager.paths.user, `${userId}.json`);
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

async function getDefaultSpaceId(email) {
    let user = await sendAuthComponentRequest(`account/${email}`);
    return user.currentSpaceId;
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

async function getActivationSuccessHTML() {
    const activationSuccessTemplate = await require('../email').getTemplate('activationSuccessTemplate')
    const baseURL = process.env.BASE_URL;
    return data.fillTemplate(activationSuccessTemplate, {
        loginRedirectURL: baseURL
    })
}

async function getActivationFailHTML(failReason) {
    const activationFailTemplate = await require('../email').getTemplate('activationFailTemplate')
    const baseURL = process.env.BASE_URL;
    return data.fillTemplate(activationFailTemplate, {
        redirectURL: baseURL,
        failReason: failReason
    })
}

async function registerInvite(referrerId, spaceId, email) {
    const spacePendingInvitationsObj = await Space.APIs.getSpacesPendingInvitationsObject();
    const invitationToken = await crypto.generateVerificationToken();
    spacePendingInvitationsObj[invitationToken] = {
        spaceId: spaceId,
        referrerId: referrerId,
        email: email,
        invitationDate: date.getCurrentUnixTime()
    }
    await Space.APIs.updateSpacePendingInvitations(spacePendingInvitationsObj);
    return invitationToken;
}


async function getUserPrivateChatAgentId(userId, spaceId) {
    const userFile = await getUserFile(userId);
    if(!userFile.spaces[spaceId]){
        return null;
    }
    if (userFile.spaces[spaceId].privateChatAgentId) {
        return userFile.spaces[spaceId].privateChatAgentId;
    } else {
        const defaultSpaceAgentId = await Space.APIs.getDefaultSpaceAgentId(spaceId);
        userFile.spaces[spaceId].privateChatAgentId = defaultSpaceAgentId;
        await updateUserFile(userId, userFile);
        return defaultSpaceAgentId;
    }
}

async function sendPasswordResetCode(email) {
    const passwordResetCode = await crypto.generateVerificationCode();
    const userMap = await getUserMap();
    if (!userMap[email]) {
        const error = new Error(`User with email ${email} does not exist`);
        error.statusCode = 404;
        throw error;
    }
    const userId = userMap[email];
    /* TODO this causes concurrency issues when multiple users are reseting their passwords at the same time */
    const userCredentials = await getUserCredentials();
    userCredentials[userId].passwordReset = {
        code: passwordResetCode,
        expirationDate: date.incrementUnixTime(date.getCurrentUnixTimeSeconds(), {minutes: 30})
    }
    await updateUserCredentials(userCredentials);
    const {instance: emailService} = require("../email");
    await emailService.sendPasswordResetCode(email, passwordResetCode);
}

async function resetPassword(email, password, code) {
    const userMap = await getUserMap();
    if (!userMap[email]) {
        const error = new Error(`User with email ${email} does not exist`);
        error.statusCode = 404;
        throw error;
    }
    const userId = userMap[email];
    const userCredentials = await getUserCredentials();
    if (!userCredentials[userId].passwordReset) {
        const error = new Error(`No password reset code requested for this user`);
        error.statusCode = 404;
        throw error;
    }

    if (userCredentials[userId].passwordReset.code !== parseInt(code)) {
        const error = new Error(`Invalid code`);
        error.statusCode = 401;
        throw error;
    }

    if (userCredentials[userId].passwordReset.expirationDate < date.getCurrentUnixTimeSeconds()) {
        const error = new Error(`Code expired`);
        error.statusCode = 410;
        throw error;
    }

    delete userCredentials[userId].passwordReset;
    userCredentials[userId].password = crypto.hashPassword(password);
    await updateUserCredentials(userCredentials);
}

module.exports = {
    registerUser,
    activateUser,
    loginUser,
    logoutUser,
    getActivationFailHTML,
    getActivationSuccessHTML,
    getUserData,
    createDemoUser,
    linkSpaceToUser,
    unlinkSpaceFromUser,
    getDefaultSpaceId,
    updateUsersCurrentSpace,
    getUserFile,
    getUserPrivateChatAgentId,
    sendPasswordResetCode,
    resetPassword,
    getUserMap,
    registerInvite,
    addSpaceCollaborator,
    updateUserFile
}
