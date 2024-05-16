const LLMFactory = require('../factory/LLMFactory');

async function getTextResponse(APIKey,modelName, prompt, modelConfig) {
    const modelInstance = LLMFactory.createLLM(modelName, APIKey,modelConfig);
    return await modelInstance.getTextResponse(prompt);
}
async function getTextConversationResponse(APIKey,modelName, prompt, modelConfig, messagesQueue) {
    const modelInstance = LLMFactory.createLLM(modelName, APIKey,modelConfig);
    return await modelInstance.getTextConversationResponse(prompt, messagesQueue);
}
async function getTextStreamingResponse(APIKey, modelName, prompt, modelConfig, streamEmitter) {
    const modelInstance = LLMFactory.createLLM(modelName, APIKey, modelConfig);
    return await modelInstance.getTextStreamingResponse(prompt,streamEmitter);
}
async function getTextConversationStreamingResponse(APIKey, modelName, prompt, modelConfig, messagesQueue, streamEmitter) {
    const modelInstance = LLMFactory.createLLM(modelName, APIKey, modelConfig);
    return await modelInstance.getTextConversationStreamingResponse(prompt,messagesQueue,streamEmitter);
}

module.exports={
    getTextResponse,
    getTextConversationResponse,
    getTextStreamingResponse,
    getTextConversationStreamingResponse
}