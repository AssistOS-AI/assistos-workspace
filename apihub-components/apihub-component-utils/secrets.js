const apihub = require('apihub');

const config = require("../../data-volume/config/config.json");
const crypto = require("./crypto");


function getSpaceSecretsContainerName(spaceId) {
    return `${spaceId}`
}

async function createSpaceSecretsContainer(spaceId) {
    const {getLLMConfigs} = require('../llms/controller.js');
    let LLMConfigs = await getLLMConfigs();
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    let secretObject = {};
    for (const companyObj of LLMConfigs) {
        secretObject[companyObj.company] = {
            ownerId: "",
            addedAt: ""
        };
        for (const key of companyObj.authentication) {
            secretObject[companyObj.company][key] = "";
        }
    }
    await secretsService.putSecretAsync(getSpaceSecretsContainerName(spaceId), "apiKeys", secretObject)

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

async function putSpaceKey(spaceId, keyType, apiKeyObj) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    const spaceAPIKeyObject = secretsService.getSecretSync(getSpaceSecretsContainerName(spaceId), "apiKeys")
    if (!spaceAPIKeyObject[keyType]) {
        const error = new Error("Key Type not supported")
        error.statusCode = 400
        throw error
    }
    spaceAPIKeyObject[keyType] = apiKeyObj;
    try {
        await secretsService.putSecretAsync(getSpaceSecretsContainerName(spaceId), "apiKeys", spaceAPIKeyObject)
    } catch (e) {
        const error = new Error("Failed to add key")
        error.statusCode = 500
        throw error
    }
}
async function deleteSpaceKey(spaceId, keyType) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    const spaceAPIKeyObject = secretsService.getSecretSync(getSpaceSecretsContainerName(spaceId), "apiKeys")
    if (!spaceAPIKeyObject[keyType]) {
        const error = new Error("Key Type not supported")
        error.statusCode = 400
        throw error
    }
    for(let key of Object.keys(spaceAPIKeyObject[keyType])){
        spaceAPIKeyObject[keyType][key] = "";
    }
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
async function getAPIKeys(spaceId) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    return secretsService.getSecretSync(getSpaceSecretsContainerName(spaceId), "apiKeys")
}
async function getApiHubAuthSecret(){
    const secretName = "ApiHubAuth";
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    let authSecret;
    try {
        authSecret = secretsService.getSecretSync('JWT', secretName);
    } catch (error) {
        authSecret = crypto.generateSecret();
        await secretsService.putSecretAsync('JWT', secretName, authSecret);
    }
    return authSecret;
}
module.exports = {
    createSpaceSecretsContainer,
    keyAlreadyExists,
    putSpaceKey,
    deleteSpaceKey,
    getModelAPIKey,
    getAPIKeys,
    getApiHubAuthSecret
}