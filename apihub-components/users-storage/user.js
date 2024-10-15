const fsPromises = require('fs').promises;
const path = require('path');
const crypto = require("../apihub-component-utils/crypto");
const data = require('../apihub-component-utils/data.js');
const date = require('../apihub-component-utils/date.js');

const volumeManager = require('../volumeManager.js');
const Space = require("../spaces-storage/space");
const {instance: emailService} = require("../email");

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
    await sendActivationEmail(email, registrationUserObject.verificationToken);
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
            const createdSpaceId = (await Space.APIs.createSpace(spaceName, userId)).id;
            user.currentSpaceId = createdSpaceId
            user.spaces[createdSpaceId] = {};
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
                await addSpaceCollaborator(invitation.spaceId, userDataObject.id, invitation.referrerId, [Space.constants.spaceRoles.Collaborator]);
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

async function addSpaceCollaborator(spaceId, userId, referrerId, role) {
    await linkSpaceToUser(userId, spaceId)
    try {
        await linkUserToSpace(spaceId, userId, referrerId, role)
    } catch (error) {
        await unlinkSpaceFromUser(userId, spaceId);
        throw error;
    }
}

async function createDemoUser() {
    const {username, email, password} = require('./demoUser.json');
    await registerUser(username, email, crypto.hashPassword(password))
    const userPendingActivation = await getUserPendingActivation()
    const activationToken = Object.keys(userPendingActivation)[0]
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

async function linkSpaceToUser(userId, spaceId) {
    const userFile = await getUserFile(userId)

    if (userFile.spaces[spaceId]) {
        const error = new Error(`Space ${spaceId} is already linked to user ${userId}.`);
        error.statusCode = 400;
        throw error;
    }
    userFile.spaces[spaceId] = {};
    userFile.currentSpaceId = spaceId;
    await updateUserFile(userId, userFile);

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


function createContainerName(spaceId, userId) {
    return `${spaceId}-${userId}`;
}

async function getSecret(spaceId, userId, secretName) {
    let containerName = createContainerName(spaceId, userId);
    let rootFolder = require("../../data-volume/config/securityConfig.json").SERVER_ROOT_FOLDER;
    const secretsService = await require('apihub').getSecretsServiceInstanceAsync(rootFolder);
    return secretsService.getSecretSync(containerName, secretName);
}

async function addSecret(spaceId, userId, body) {
    let containerName = createContainerName(spaceId, userId);
    let rootFolder = require("../../data-volume/config/securityConfig.json").SERVER_ROOT_FOLDER;
    const secretsService = await require('apihub').getSecretsServiceInstanceAsync(rootFolder);
    await secretsService.putSecretAsync(containerName, body.secretName, body.secret);
}

async function deleteSecret(spaceId, userId, secretName) {
    let containerName = createContainerName(spaceId, userId);
    let rootFolder = require("../../data-volume/config/securityConfig.json").SERVER_ROOT_FOLDER;
    const secretsService = await require('apihub').getSecretsServiceInstanceAsync(rootFolder);
    await secretsService.deleteSecretAsync(containerName, secretName);
}

async function userSecretExists(spaceId, userId, secretName) {
    let rootFolder = require("../../data-volume/config/securityConfig.json").SERVER_ROOT_FOLDER;
    const secretsService = await require('apihub').getSecretsServiceInstanceAsync(rootFolder);
    let containerName = createContainerName(spaceId, userId);
    try {
        secretsService.getSecretSync(containerName, secretName);
        return true;
    } catch (e) {
        //secret for user doesn't exist
        return false;
    }
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

async function inviteSpaceCollaborators(referrerId, spaceId, collaboratorsEmails) {
    const emailService = require('../email').instance;
    const userMap = await getUserMap();
    const spaceStatusObject = await Space.APIs.getSpaceStatusObject(spaceId);
    const spaceName = spaceStatusObject.name;
    const existingUserIds = Object.keys(spaceStatusObject.users)
    let existingCollaborators = [];
    for (let email of collaboratorsEmails) {
        const userId = userMap[email];

        if (userId && existingUserIds.includes(userId)) {
            existingCollaborators.push(email);
            continue;
        }
        if (userId) {
            await addSpaceCollaborator(spaceId, userId, referrerId, [Space.constants.spaceRoles.Collaborator]);
            await emailService.sendUserAddedToSpaceEmail(email, spaceName);
        } else {
            const invitationToken = await registerInvite(referrerId, spaceId, email);
            await emailService.sendUserAddedToSpaceEmail(email, spaceName, invitationToken);
        }
    }
    return existingCollaborators;
}


async function getUserPrivateChatAgentId(userId, spaceId) {
    const userFile = await getUserFile(userId);
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
    APIs: {
        registerUser,
        activateUser,
        loginUser,
        logoutUser,
        getActivationFailHTML,
        getActivationSuccessHTML,
        getUserData,
        createDemoUser,
        linkSpaceToUser,
        getDefaultSpaceId,
        updateUsersCurrentSpace,
        inviteSpaceCollaborators,
        getSecret,
        userSecretExists,
        addSecret,
        deleteSecret,
        getUserFile,
        getUserPrivateChatAgentId,
        sendPasswordResetCode,
        resetPassword
    }
}
