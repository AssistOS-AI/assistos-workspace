const {SERVER_ROOT_FOLDER} = require('../../../config.json')
const validateOpenAIKey = require('../../exporter.js')
('validateOpenAIKey');


async function saveSpaceAPIKeySecret(spaceId, apiKey) {
    const apihub= require('apihub');
    const secretsService = await apihub.getSecretsServiceInstanceAsync(SERVER_ROOT_FOLDER);
    const containerName = `${spaceId}.APIKey`
    const keyValidation = await validateOpenAIKey(apiKey);
    if (keyValidation) {
        await secretsService.putSecretAsync(containerName, "OpenAiAPIKey", apiKey);
    }
}

module.exports = saveSpaceAPIKeySecret;