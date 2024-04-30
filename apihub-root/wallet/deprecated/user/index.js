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

}
async function initUser(spaceId) {
    let space = assistOS.loadModule("space");
    assistOS.user = new User(await assistOS.storage.loadUser());
    //assistOS.currentAgent/Agent=loadAgent(...)
    await space.loadSpace(spaceId);
}





