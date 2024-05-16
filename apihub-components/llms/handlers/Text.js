const APIKeyDecorator = require('../decorators/APIKeyDecorator.js');
const TextWrapper = require('../wrappers/TextWrapper.js');

async function getTextResponse(APIKey, modelName, prompt, modelConfig, messagesQueue) {
    if (messagesQueue && messagesQueue.length > 0) {
        return await TextWrapper.getTextConversationResponse(APIKey, modelName, prompt, modelConfig, messagesQueue);
    } else {
        return await TextWrapper.getTextResponse(APIKey, modelName, prompt, modelConfig);
    }
}

async function getTextStreamingResponse(APIKey, modelName, prompt, modelConfig, messagesQueue, streamEmitter) {
    if (messagesQueue && messagesQueue.length > 0) {
        return await TextWrapper.getTextConversationStreamingResponse(APIKey, modelName, prompt, modelConfig, messagesQueue, streamEmitter);
    } else {
        return await TextWrapper.getTextStreamingResponse(APIKey, modelName, prompt, modelConfig, streamEmitter);
    }
}

module.exports = {
    APIs: {
        getTextResponse: async (spaceId, modelName, prompt, modelConfig, messagesQueue) =>
            await APIKeyDecorator(spaceId, modelName, getTextResponse, modelName, prompt, modelConfig, messagesQueue),
        getTextStreamingResponse: async (spaceId, modelName, prompt, modelConfig, messagesQueue, streamEmitter) =>
            await APIKeyDecorator(spaceId, modelName, getTextStreamingResponse, modelName, prompt, modelConfig, messagesQueue, streamEmitter)
    }
};
