async function registerUser(name, email, password) {
    return await assistOS.storage.registerUser(name, email, password);
}

async function activateUser(activationToken) {
    return await assistOS.storage.activateUser(activationToken);
}

async function loginUser(email, password) {
    return await assistOS.storage.loginUser(email, password);
}

async function logoutUser() {
    return await assistOS.storage.logoutUser();
}

async function addKeyToSpace(spaceId, userId, keyType, apiKey) {
    return assistOS.storage.addKeyToSpace(spaceId, userId, keyType, apiKey);
}

async function storeGITCredentials(stringData) {
    return await assistOS.storage.storeGITCredentials(assistOS.space.id, assistOS.user.id, stringData);
}

async function getUsersSecretsExist() {
    return await assistOS.storage.getUsersSecretsExist(assistOS.space.id);
}
async function initUser(spaceId) {
    let space = assistOS.loadModule("space");
    assistOS.user = new User(await assistOS.storage.loadUser());
    await space.loadSpace(spaceId);
}

function getCookieValue(cookieName) {
    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
}



