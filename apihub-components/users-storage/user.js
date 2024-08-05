const fsPromises = require('fs').promises;
const path = require('path');

const crypto = require("../apihub-component-utils/crypto");
const data = require('../apihub-component-utils/data.js');
const date = require('../apihub-component-utils/date.js');
const file = require('../apihub-component-utils/file.js');

const volumeManager = require('../volumeManager.js');
const Space = require("../spaces-storage/space");
const {instance: emailService} = require("../email");
const eventPublisher = require("../subscribers/eventPublisher");

const tableName = "UsersActiveSessions";


async function registerUser(email, password, photo, inviteToken) {
    const currentDate = date.getCurrentUTCDate();
    const userRegistrationTemplate = require('./templates/userRegistrationTemplate.json')
    let userPhoto = photo || await getDefaultUserPhoto();
    const registrationUserObject = data.fillTemplate(userRegistrationTemplate, {
        email: email,
        photo: userPhoto,
        inviteToken: inviteToken || null,
        passwordHash: crypto.hashPassword(password),
        verificationToken: await crypto.generateVerificationToken(),
        verificationTokenExpirationDate: date.incrementUTCDate(currentDate, {minutes: 30}),
        currentDate: currentDate,
    })
    if (inviteToken) {
        const spacePendingInvitationsObj = await Space.APIs.getSpacesPendingInvitationsObject();
        const invitation = spacePendingInvitationsObj[inviteToken];
        registrationUserObject.email = invitation.email;
    }
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

async function createUser(email, photo, withDefaultSpace = false) {
    const Space = require('../spaces-storage/space.js');
    const defaultUserTemplate = require('./templates/defaultUserTemplate.json')
    const rollback = async () => {
        await fsPromises.rm(userPath, {recursive: true, force: true});
        if (withDefaultSpace) {
            await Space.APIs.deleteSpace(user.currentSpaceId)
        }
    }

    const userId = crypto.generateId();
    const username= email.split('@')[0];
    const spaceName = data.fillTemplate(
        Space.templates.defaultSpaceNameTemplate,
        {
            username: username.endsWith('s') ? username + "'" : username + "'s"
        }
    )
    const user = data.fillTemplate(defaultUserTemplate,
        {
            id: userId,
            email: email,
            photo: photo
        }
    )

    const userPath = getUserFilePath(userId)
    try {
        await updateUserFile(userId, user)
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
        const userDataObject = await createUser( user.email, user.photo, true);
        const userMap = await getUserMap();
        userMap[user.email] = userDataObject.id;
        await updateUserMap(userMap);
        delete user.photo
        const userCredentials = await getUserCredentials();
        userCredentials[userDataObject.id] = user;
        userCredentials[userDataObject.id].activationDate = date.getCurrentUTCDate();
        await updateUserCredentials(userCredentials);
        let inviteToken = user.inviteToken;
        if (inviteToken) {
            const spacePendingInvitationsObj = await Space.APIs.getSpacesPendingInvitationsObject();
            const invitation = spacePendingInvitationsObj[inviteToken];
            await acceptSpaceInvitation(inviteToken, false);
            let user = await getUserFile(userDataObject.id);
            user.currentSpaceId = invitation.spaceId;
            await updateUserFile(userDataObject.id, user);
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

async function addSpaceCollaborators(spaceId, userId, referrerId, role) {
    await linkSpaceToUser(userId, spaceId)
    try {
        await linkUserToSpace(spaceId, userId, referrerId, role)
    } catch (error) {
        await unlinkSpaceFromUser(userId, spaceId);
        throw error;
    }
}

async function createDemoUser() {
    const {username, email, password} = require('./templates/demoUser.json');
    await registerUser(username, email, crypto.hashPassword(password))
    const userPendingActivation = await getUserPendingActivation()
    const activationToken = Object.keys(userPendingActivation)[0]
    await activateUser(activationToken);
}

async function getDefaultUserPhoto() {
    const defaultUserPhotoPath = path.join(__dirname, 'templates/defaultUserPhoto.png');
    const defaultUserPhoto = await fsPromises.readFile(defaultUserPhotoPath);
    return await file.convertImageToBase64(defaultUserPhoto, 'image/png');
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
    let rootFolder = require("../securityConfig.json").SERVER_ROOT_FOLDER;
    const secretsService = await require('apihub').getSecretsServiceInstanceAsync(rootFolder);
    return secretsService.getSecretSync(containerName, secretName);
}

async function addSecret(spaceId, userId, body) {
    let containerName = createContainerName(spaceId, userId);
    let rootFolder = require("../securityConfig.json").SERVER_ROOT_FOLDER;
    const secretsService = await require('apihub').getSecretsServiceInstanceAsync(rootFolder);
    await secretsService.putSecretAsync(containerName, body.secretName, body.secret);
}

async function deleteSecret(spaceId, userId, secretName) {
    let containerName = createContainerName(spaceId, userId);
    let rootFolder = require("../securityConfig.json").SERVER_ROOT_FOLDER;
    const secretsService = await require('apihub').getSecretsServiceInstanceAsync(rootFolder);
    await secretsService.deleteSecretAsync(containerName, secretName);
}

async function userSecretExists(spaceId, userId, secretName) {
    let rootFolder = require("../securityConfig.json").SERVER_ROOT_FOLDER;
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
    await Space.APIs.updateSpacePendingInvitations(spaceId, spacePendingInvitationsObj);
    return invitationToken;
}

async function inviteSpaceCollaborators(referrerId, spaceId, collaboratorsEmails) {
    const emailService = require('../email').instance;
    const userMap = await getUserMap();
    const spaceStatusObject = await Space.APIs.getSpaceStatusObject(spaceId);
    const spaceName = spaceStatusObject.name;
    const existingUserIds = Object.keys(spaceStatusObject.users)
    let collaborators = [];
    for (let email of collaboratorsEmails) {
        const userId = userMap[email];

        if (userId && existingUserIds.includes(userId)) {
            collaborators.push(email);
            continue;
        }

        const invitationToken = await registerInvite(referrerId, spaceId, email);
        if (userId) {
            await emailService.sendSpaceInvitationEmail(email, invitationToken, spaceName);
        } else {
            await emailService.sendSpaceInvitationEmail(email, invitationToken, spaceName, true);
        }
    }
    return collaborators;
}

async function acceptSpaceInvitation(invitationToken, newUser) {
    const spacePendingInvitationsObj = await Space.APIs.getSpacesPendingInvitationsObject();
    const invitation = spacePendingInvitationsObj[invitationToken];
    if (!invitation) {
        return await getSpaceInvitationErrorHTML('Invalid invitation token');
    }
    const {spaceId, referrerId, email} = invitation;
    if (!newUser) {
        const userMap = await getUserMap();
        const userId = userMap[email];
        await addSpaceCollaborators(spaceId, userId, referrerId, [Space.constants.spaceRoles.Collaborator]);
        delete spacePendingInvitationsObj[invitationToken];
        await Space.APIs.updateSpacePendingInvitations(spaceId, spacePendingInvitationsObj);
        const spaceName = await Space.APIs.getSpaceName(spaceId)
        return await getSpaceInvitationSuccessfulHTML(spaceName)
    } else {
        const spaceName = await Space.APIs.getSpaceName(spaceId);
        return await getCreateAccountHTML(spaceName, invitationToken)
    }
}

async function rejectSpaceInvitation(invitationToken) {
    const spacePendingInvitationsObj = await Space.APIs.getSpacesPendingInvitationsObject();
    const invitation = spacePendingInvitationsObj[invitationToken];
    if (!invitation) {
        return await getSpaceInvitationErrorHTML('Invalid invitation token');
    }
    const {spaceId} = invitation
    const spaceName = await Space.APIs.getSpaceName(spaceId)
    delete spacePendingInvitationsObj[invitationToken];
    await Space.APIs.updateSpacePendingInvitations(invitation.spaceId, spacePendingInvitationsObj);
    return await getSpaceInvitationRejectedHTML(spaceName)
}

async function getCreateAccountHTML(spaceName, invitationToken) {
    const baseURL = process.env.BASE_URL;
    const redirectURL = `${baseURL}/#authentication-page/inviteToken/${invitationToken}`;
    return data.fillTemplate(await require('../email').getTemplate('createAccountTemplate'),
        {
            spaceName: spaceName,
            redirectURL: redirectURL
        });
}

async function getSpaceInvitationSuccessfulHTML(spaceName) {
    const baseURL = process.env.BASE_URL;
    return data.fillTemplate(await require('../email').getTemplate('spaceInvitationAcceptedTemplate'),
        {
            spaceName: spaceName,
            redirectURL: baseURL
        });
}

async function getSpaceInvitationRejectedHTML(spaceName) {
    const baseURL = process.env.BASE_URL;
    return data.fillTemplate(await require('../email').getTemplate('spaceInvitationRejectedTemplate'),
        {
            spaceName: spaceName,
            redirectURL: baseURL
        });
}

async function getSpaceInvitationErrorHTML(error) {
    const baseURL = process.env.BASE_URL;
    return data.fillTemplate(await require('../email').getTemplate('spaceInvitationErrorTemplate'),
        {
            errorMessage: error,
            redirectURL: baseURL
        });
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
        acceptSpaceInvitation,
        rejectSpaceInvitation,
        getSpaceInvitationErrorHTML,
        getUserFile,
        getUserPrivateChatAgentId
    },
    templates: {
        userRegistrationTemplate: require('./templates/userRegistrationTemplate.json'),
        defaultUserTemplate: require('./templates/defaultUserTemplate.json'),
        demoUser: require('./templates/demoUser.json'),
    }
}
