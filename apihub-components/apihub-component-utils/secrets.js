const apihub = require('apihub');

function getContainerName(spaceId) {
    return `${spaceId}`
}
const spaceSecretName = "spaceSecrets";
const serverConfig = apihub.getServerConfig();
const SERVER_ROOT_FOLDER = serverConfig.storage;

async function createSpaceSecretsContainer(spaceId) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(SERVER_ROOT_FOLDER);
    const secrets = require("../globalServerlessAPI/defaults/defaultSecrets.json")
    await secretsService.putSecretAsync(getContainerName(spaceId), spaceSecretName, secrets)
}


async function putSpaceKey(spaceId, userId, secretKey, value) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(SERVER_ROOT_FOLDER);
    const secrets = secretsService.getSecretSync(getContainerName(spaceId), spaceSecretName)
    if (!secrets.hasOwnProperty(secretKey)) {
        throw new Error("Secret not found")
    }
    secrets[secretKey] = value;
    try {
        await secretsService.putSecretAsync(getContainerName(spaceId), spaceSecretName, secrets)
    } catch (e) {
        throw new Error("Failed to add secret")
    }
}

async function getSecret(spaceId, secretKey) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(SERVER_ROOT_FOLDER);
    const secrets = secretsService.getSecretSync(getContainerName(spaceId), spaceSecretName)
    if (!secrets[secretKey]) {
        throw new Error("Secret not found")
    }
    return secrets[secretKey];
}

const spacePrivateSecretName = "spacePrivateSecrets";
async function addSpaceEnvVarsSecrets(spaceId, envVars) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(SERVER_ROOT_FOLDER);
    await secretsService.putSecretAsync(getContainerName(spaceId), spacePrivateSecretName, envVars)
}
async function addSecret(spaceId, userId, secretKey, value) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(SERVER_ROOT_FOLDER);
    const spaceAPIKeyObject = secretsService.getSecretSync(getContainerName(spaceId), spaceSecretName)

    if(spaceAPIKeyObject[secretKey]){
        return
    }
    spaceAPIKeyObject[secretKey] = value;
    await secretsService.putSecretAsync(getContainerName(spaceId), spaceSecretName, spaceAPIKeyObject)
}

async function deleteSecret(spaceId, secretKey) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(SERVER_ROOT_FOLDER);
    const spaceAPIKeyObject = secretsService.getSecretSync(getContainerName(spaceId), spaceSecretName)
    const providers = require("../globalServerlessAPI/defaults/defaultSecrets.json")
    if(!spaceAPIKeyObject[secretKey]){
        return;
    }
    let defaultSecret = providers.find(provider => provider.keyName === secretKey);
    if(defaultSecret){
        throw new Error("Cannot delete default secret");
    }
    delete spaceAPIKeyObject[secretKey];
    await secretsService.putSecretAsync(getContainerName(spaceId), spaceSecretName, spaceAPIKeyObject)
}
async function deleteSpaceSecrets(spaceId) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(SERVER_ROOT_FOLDER);
    await secretsService.deleteSecretAsync(getContainerName(spaceId), spaceSecretName)
}
async function getAPIKeys(spaceId) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(SERVER_ROOT_FOLDER);
    return secretsService.getSecretSync(getContainerName(spaceId), spaceSecretName)
}
function maskSecret(str) {
    if (str.length <= 10) {
        return str;
    }
    const start = str.slice(0, 6);
    const end = str.slice(-4);
    const maskedLength = str.length - 10;
    const masked = '*'.repeat(maskedLength);
    return start + masked + end;
}
async function getSecretsMasked(spaceId) {
    let keys = JSON.parse(JSON.stringify(await getAPIKeys(spaceId)));
    for (let keyType in keys) {
        keys[keyType] = maskSecret(keys[keyType]);
    }
    return keys;
}
module.exports = {
    putSpaceKey,
    getSecret,
    getAPIKeys,
    addSecret,
    deleteSecret,
    getSecretsMasked,
    deleteSpaceSecrets,
    addSpaceEnvVarsSecrets,
    createSpaceSecretsContainer
}
