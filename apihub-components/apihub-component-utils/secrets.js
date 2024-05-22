const apihub = require('apihub');

const config = require("../config.json");


function getSpaceSecretsContainerName(spaceId) {
    return `${spaceId}`
}

async function createSpaceSecretsContainer(spaceId) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    const secretsContainerTemplate = require('../spaces-storage/templates/spaceSecretsContainerTemplate.json')
    for (const key of Object.keys(secretsContainerTemplate)) {
        await secretsService.putSecretAsync(getSpaceSecretsContainerName(spaceId), key, secretsContainerTemplate[key])
    }
}

async function keyAlreadyExists(spaceId, keyType, apiKey) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    const spaceAPIKeyObject = secretsService.getSecretSync(getSpaceSecretsContainerName(spaceId), "apiKeys")
    if (!spaceAPIKeyObject[keyType]) {
        const error = new Error("Key Type not supported")
        error.statusCode = 400
        throw error
    }
    return Object.values(spaceAPIKeyObject[keyType]).includes(apiKey);
}

async function putSpaceKey(spaceId, keyType, apiKey) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    const spaceAPIKeyObject = secretsService.getSecretSync(getSpaceSecretsContainerName(spaceId), "apiKeys")
    if (!spaceAPIKeyObject[keyType]) {
        const error = new Error("Key Type not supported")
        error.statusCode = 400
        throw error
    }
    spaceAPIKeyObject[keyType] = apiKey;
    try {
        await secretsService.putSecretAsync(getSpaceSecretsContainerName(spaceId), "apiKeys", spaceAPIKeyObject)
    } catch (e) {
        const error = new Error("Failed to add key")
        error.statusCode = 500
        throw error
    }
}
async function deleteSpaceKey(spaceId, keyType, keyId) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    const spaceAPIKeyObject = secretsService.getSecretSync(getSpaceSecretsContainerName(spaceId), "apiKeys")
    if (!spaceAPIKeyObject[keyType]) {
        const error = new Error("Key Type not supported")
        error.statusCode = 400
        throw error
    }
    delete spaceAPIKeyObject[keyType][keyId]
    try {
        await secretsService.putSecretAsync(getSpaceSecretsContainerName(spaceId), "apiKeys", spaceAPIKeyObject)
    } catch (e) {
        const error = new Error("Failed to delete key")
        error.statusCode = 500
        throw error
    }
}
async function getModelAPIKey(spaceId, keyType) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    const spaceAPIKeyObject = secretsService.getSecretSync(getSpaceSecretsContainerName(spaceId), "apiKeys")
    if (!spaceAPIKeyObject[keyType]) {
        const error = new Error("Key Type not supported")
        error.statusCode = 400
        throw error
    }
    return spaceAPIKeyObject[keyType];
}
module.exports = {
    createSpaceSecretsContainer,
    keyAlreadyExists,
    putSpaceKey,
    deleteSpaceKey,
    getModelAPIKey
}