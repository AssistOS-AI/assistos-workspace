const secrets = require('../../apihub-component-utils/secrets.js');

module.exports = async function(spaceId, modelName, callbackFunc, ...callbackFuncArgs) {
    const APIKey = await secrets.getModelAPIKey(spaceId, modelName);
    if (!APIKey) {
        const error = new Error("API key not found");
        error.statusCode = 400;
        throw error;
    }
    return await callbackFunc(APIKey, ...callbackFuncArgs);
}
