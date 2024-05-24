const LLMFactory = require('../factory/LLMFactory');

async function generateImage(APIKey,modelName, prompt) {
    const modelInstance = LLMFactory.createLLM(modelName, APIKey);
    return await modelInstance.generateImage(prompt);
}
async function generateImageVariants(APIKey,modelName, imageReadStreamSrc, configs) {
    const modelInstance = LLMFactory.createLLM(modelName, APIKey);
    return await modelInstance.generateImageVariants(imageReadStreamSrc, configs);
}
async function editImage(APIKey,modelName, imageReadStreamSrc,imageReadStreamMask, configs) {
    const modelInstance = LLMFactory.createLLM(modelName, APIKey);
    return await modelInstance.editImage(prompt);
}

module.exports={
    generateImage,
    generateImageVariants,
    editImage
}