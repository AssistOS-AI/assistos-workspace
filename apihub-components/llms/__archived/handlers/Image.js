const APIKeyDecorator = require('../decorators/APIKeyDecorator.js');
const ImageWrapper = require('../wrappers/ImageWrapper.js');

async function generateImage(APIKey,modelName, prompt) {
    return await ImageWrapper.generateImage(APIKey, modelName, prompt);
}

module.exports = {
    APIS: {
        generateImage: async (spaceId, modelName, prompt) => await APIKeyDecorator(spaceId, modelName, generateImage, modelName, prompt)
    }
}