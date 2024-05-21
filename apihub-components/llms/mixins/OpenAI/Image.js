
async function createOpenAIInstance(apiKey) {
    if (!apiKey) {
        const error = new Error("API key not provided");
        error.statusCode = 400;
        throw error;
    }
    const OpenAILib = (await import('openai')).default;

    return new OpenAILib({apiKey});
}

module.exports = async function (modelInstance) {
    const OpenAI = await createOpenAIInstance(modelInstance.apiKey);
    const data = require('../../../apihub-component-utils/data.js')
    const promptRevisionOverrideTemplate = require('../../models/image/DALL-E-3/promptRevisionOverrideTemplate.json')
    modelInstance.generateImage = async function (prompt, configs) {
        const response = await OpenAI.images.generate(
            {
                model: modelInstance.getModelName(),
                prompt: data.fillTemplate(promptRevisionOverrideTemplate.prompt, {prompt: prompt}),
                ...(configs.size ? {size: configs.size} : {}),
                ...(configs.quality ? {quality: configs.quality} : {}),
                n: 1
            },
        )
        const image = response.data[0].url;
        delete response.data[0].url;
        return {
            image: image,
            metadata: response.data[0]
        }
    }
    modelInstance.generateImageVariants = async function (imageReadStream, configs) {
        const response= OpenAI.images.createVariation(
            {
                model: "dall-e-2",
                image: imageReadStream,
                ...(configs.size ? {size: configs.size} : {}),
                ...(configs.variants ? {n: configs.variants} : {}),
                ...(configs.response_format? {response_format: configs.response_format} : {}),
            },
        )
        return response;
    }

}
