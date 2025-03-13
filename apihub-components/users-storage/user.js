const fsPromises = require('fs').promises;
const path = require('path');
const crypto = require("../apihub-component-utils/crypto");
const data = require('../apihub-component-utils/data.js');
const date = require('../apihub-component-utils/date.js');
const volumeManager = require('../volumeManager.js');
const Space = require("../spaces-storage/space");

async function updateUserImage(email, imageId, walletKey) {
    let user = await sendAuthComponentRequest(`getInfo/${email}`, 'GET', "", walletKey, email);
    user.imageId = imageId;
    await sendAuthComponentRequest(`setInfo/${email}`, 'PUT', user, walletKey, email);
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
}

async function loadUser(email, walletKey) {
    let user = await sendAuthComponentRequest(`getInfo/${email}`, 'GET', "", walletKey, email);
    return {
        id: user.id,
        email: email,
        currentSpaceId: user.currentSpaceId,
        spaces: user.spaces,
        imageId: user.imageId
    }
}
async function sendAuthComponentRequest(endpoint, method = "GET", body, walletKey, email, headers) {
    let url = `${process.env.BASE_URL}/auth/${endpoint}`;
    if(!headers){
        headers = {}
    }
    let init = {
        method: method,
        headers: headers
    };
    if(walletKey){
        init.headers.Cookie = `walletKey=${walletKey}; email=${email}`;
    }
    if(method === "POST" || method === "PUT"){
        init.body = JSON.stringify(body);
    }
    let response = await fetch(url, init);
    return await response.json();
}
async function linkSpaceToUser(email, spaceId, walletKey) {
    let user = await sendAuthComponentRequest(`getInfo/${email}`, 'GET', "", walletKey, email);
    user.currentSpaceId = spaceId;
    if(!user.spaces){
        user.spaces = [];
    }
    if(user.spaces.includes(spaceId)){
        console.log(`User ${email} is already linked to space ${spaceId}`);
        return;
    }
    user.spaces.push(spaceId);
    await sendAuthComponentRequest(`setInfo/${email}`, 'PUT', user, walletKey, email);
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

async function unlinkSpaceFromUser(userId, spaceId) {
    const userFile = await getUserFile(userId)

    delete userFile.spaces[spaceId];

    if (userFile.currentSpaceId === spaceId) {
        let spaces = Object.keys(userFile.spaces);
        userFile.currentSpaceId = spaces.length > 0 ? spaces[0] : null;
    }
    await updateUserFile(userId, userFile);
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

async function updateUsersCurrentSpace(email, spaceId, walletKey) {
    let user = await sendAuthComponentRequest(`getInfo/${email}`, 'GET', "", walletKey, email);
    user.currentSpaceId = spaceId;
    await sendAuthComponentRequest(`setInfo/${email}`, 'PUT', user, walletKey, email);
}

async function getDefaultSpaceId(email, walletKey) {
    let user = await sendAuthComponentRequest(`getInfo/${email}`, 'GET', "", walletKey, email);
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
async function logoutUser(email, walletKey) {
    let response = await sendAuthComponentRequest(`walletLogout`, 'POST', "", walletKey, email);
    return response.ok;
}
module.exports = {
    getActivationFailHTML,
    getActivationSuccessHTML,
    createDemoUser,
    linkSpaceToUser,
    unlinkSpaceFromUser,
    getDefaultSpaceId,
    updateUsersCurrentSpace,
    getUserFile,
    getUserMap,
    registerInvite,
    addSpaceCollaborator,
    loadUser,
    updateUserImage,
    logoutUser
}
