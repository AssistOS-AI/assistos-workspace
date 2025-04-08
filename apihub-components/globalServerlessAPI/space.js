const date = require('../apihub-component-utils/date.js');
const openAI = require('../apihub-component-utils/openAI.js');
const secrets = require('../apihub-component-utils/secrets.js');

async function editAPIKey(spaceId, userId, type, APIKey) {
    let providers = require("./AIModels.json")
    let llm = providers.find((llm) => llm.provider === type);
    let apiKeyObj = {
        ownerId: userId,
        addedDate: date.getCurrentUTCDate()
    }
    for (let key of llm.authentication) {
        apiKeyObj[key] = APIKey;
    }
    await secrets.putSpaceKey(spaceId, type, apiKeyObj);
}

async function getAPIKeysMasked(spaceId) {
    let keys = JSON.parse(JSON.stringify(await secrets.getAPIKeys(spaceId)));
    for (let keyType in keys) {
        if (keys[keyType].APIKey) {
            keys[keyType].APIKey = openAI.maskKey(keys[keyType].APIKey);
        }
        if (keys[keyType].userId) {
            keys[keyType].userId = openAI.maskKey(keys[keyType].userId);
        }
    }
    return keys;
}


module.exports = {
        editAPIKey,
        getAPIKeysMasked,
}

