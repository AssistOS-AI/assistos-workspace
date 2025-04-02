const apihub = require('apihub');

const config = require("../../data-volume/config/config.json");

function getSpaceSecretsContainerName(spaceId) {
    return `${spaceId}`
}

async function createSpaceSecretsContainer(spaceId) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    let secretObject = {};
    const providers = require("../globalServerlessAPI/AIModels.json")
    for (const llm of providers) {
        secretObject[llm.provider] = {
            ownerId: "",
            addedAt: ""
        };
        for (const key of llm.authentication) {
            secretObject[llm.provider][key] = "";
        }
    }
    await secretsService.putSecretAsync(getSpaceSecretsContainerName(spaceId), "apiKeys", secretObject)

}
async function putSpaceKey(spaceId, keyType, apiKeyObj) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    const spaceAPIKeyObject = secretsService.getSecretSync(getSpaceSecretsContainerName(spaceId), "apiKeys")
    if (!spaceAPIKeyObject[keyType]) {
        throw new Error("Key Type not supported")
    }
    spaceAPIKeyObject[keyType] = apiKeyObj;
    try {
        await secretsService.putSecretAsync(getSpaceSecretsContainerName(spaceId), "apiKeys", spaceAPIKeyObject)
    } catch (e) {
        throw new Error("Failed to add key")
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


async function addSecretTypeToSpace(spaceId, secretType) {
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    const spaceAPIKeyObject = secretsService.getSecretSync(getSpaceSecretsContainerName(spaceId), "apiKeys")

    if(spaceAPIKeyObject[secretType]){
        throw new Error("Secret Type already exists")
    }
    spaceAPIKeyObject[secretType] = {
        ownerId: "",
        addedAt: ""
    };
    await secretsService.putSecretAsync(getSpaceSecretsContainerName(spaceId), "apiKeys", spaceAPIKeyObject)
}

async function getAPIKeys(spaceId) {
    //TODO: this is a quick fix for the issue where new llm companies are added to llmAdapter and we need to update the existing spaces with the new companies
    //TODO: a better solution needs to be implemented

    //opening the settings-page triggers this check
    const checkForNewModels = async (secretsObject) =>{
        async function addCompanySecretsToSpace(secretsObject, companyObj) {
            secretsObject[companyObj.provider] = {
                ownerId: "",
                addedAt: ""
            };
            for (const key of companyObj.authentication) {
                secretsObject[companyObj.provider][key] = "";
            }
            await secretsService.putSecretAsync(getSpaceSecretsContainerName(spaceId), "apiKeys", secretsObject)
        }

        const providers = require("../globalServerlessAPI/AIModels.json")
        for (const llm of providers) {
            if(!secretsObject[llm.provider]){
             await addCompanySecretsToSpace(secretsObject, llm)
            }
        }
    }
    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    const secretsObject= secretsService.getSecretSync(getSpaceSecretsContainerName(spaceId), "apiKeys")
    await checkForNewModels(secretsObject);
    return secretsService.getSecretSync(getSpaceSecretsContainerName(spaceId), "apiKeys")
}

module.exports = {
    createSpaceSecretsContainer,
    putSpaceKey,
    getModelAPIKey,
    getAPIKeys,
    addSecretTypeToSpace
}
