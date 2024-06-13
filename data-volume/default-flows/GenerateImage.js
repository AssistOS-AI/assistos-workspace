const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class GenerateImage extends IFlow {
    static flowMetadata = {
        action: "Generates an image based on a prompt",
        intent: "Generate an image"
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        prompt: {
            type: "string",
            required: true
        },
        variants: {
            type: "string",
            required: false
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let llmModule = apis.loadModule("llm");
            let spaceId = parameters.spaceId;
            delete parameters.spaceId;
            let images = await llmModule.generateImage(spaceId, parameters);
            apis.success(images);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = GenerateImage;
