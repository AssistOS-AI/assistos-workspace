const data = require('../apihub-component-utils/data.js');
const date = require('../apihub-component-utils/date.js');

async function addSpaceCollaborator(spaceId, userId, role, referrerId) {
    await linkSpaceToUser(userId, spaceId)
    try {
        await linkUserToSpace(spaceId, userId, referrerId, role)
    } catch (error) {
        await unlinkSpaceFromUser(userId, spaceId);
        throw error;
    }
}


async function sendAuthComponentRequest(endpoint, method = "GET", body, authKey, email, headers) {
    let url = `${process.env.BASE_URL}/auth/${endpoint}`;
    if(!headers){
        headers = {
            "x-api-key": process.env.SSO_SECRETS_ENCRYPTION_KEY,
        }
    }
    let init = {
        method: method,
        headers: headers
    };
    if(authKey){
        init.headers.Cookie = `authKey=${authKey}; email=${email}`;
    }
    if(method === "POST" || method === "PUT"){
        init.body = JSON.stringify(body);
    }
    let response = await fetch(url, init);
    let data = await response.json();
    if(!response.ok){
        throw new Error(data.message);
    }
    return data;
}
async function linkSpaceToUser(email, spaceId, authKey) {
    let userInfo = await sendAuthComponentRequest(`getInfo/${email}`, 'GET', "", authKey, email);
    userInfo.currentSpaceId = spaceId;
    if(!userInfo.spaces){
        userInfo.spaces = [];
    }
    if(userInfo.spaces.includes(spaceId)){
        console.log(`User ${email} is already linked to space ${spaceId}`);
        return;
    }
    userInfo.spaces.push(spaceId);
    await sendAuthComponentRequest(`setInfo/${email}`, 'PUT', userInfo, authKey, email);
}

async function linkUserToSpace(spaceId, userId, referrerId, role) {
    const Space = require('../space/space.js');
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

async function unlinkSpaceFromUser(email, authKey, spaceId) {
    const userInfo = await loadUser(email, authKey);

    userInfo.spaces = userInfo.spaces.filter(id => id !== spaceId);

    if (userInfo.currentSpaceId === spaceId) {
        userInfo.currentSpaceId = userInfo.spaces.length > 0 ? userInfo.spaces[0] : null;
    }
    await sendAuthComponentRequest(`setInfo/${email}`, 'PUT', userInfo, authKey, email);
}

async function setUserCurrentSpace(email, spaceId, authKey) {
    let userInfo = await sendAuthComponentRequest(`getInfo/${email}`, 'GET', "", authKey, email);
    userInfo.currentSpaceId = spaceId;
    await sendAuthComponentRequest(`setInfo/${email}`, 'PUT', userInfo, authKey, email);
}


async function getDefaultSpaceId(email, authKey) {
    let userInfo = await sendAuthComponentRequest(`getInfo/${email}`, 'GET', "", authKey, email);
    return userInfo.currentSpaceId;
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

module.exports = {
    getActivationFailHTML,
    getActivationSuccessHTML,
    linkSpaceToUser,
    unlinkSpaceFromUser,
    getDefaultSpaceId,
    setUserCurrentSpace,
    addSpaceCollaborator,
}
