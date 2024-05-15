const LLMFactory = require('../factory/LLMFactory');

async function generateImage(APIKey,modelName, prompt) {
    const modelInstance = LLMFactory.createLLM(modelName, APIKey);
    return await modelInstance.generateImage(prompt);
}

module.exports={
    generateImage
}