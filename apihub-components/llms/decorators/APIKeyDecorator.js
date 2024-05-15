const secrets = require('../../apihub-component-utils/secrets.js');

module.exports = async function(spaceId, modelName, callbackFunc, ...callbackArgs) {
    const APIKey = secrets.getModelAPIKey(spaceId, modelName);
    if (!APIKey) {
        const error = new Error("API key not found");
        error.statusCode = 400;
        throw error;
    }
    return await callbackFunc(APIKey, ...callbackArgs);
}
