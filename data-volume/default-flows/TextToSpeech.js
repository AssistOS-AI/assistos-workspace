const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class TextToSpeech extends IFlow {
    static flowMetadata = {
        action: "generates audio based on a prompt",
        intent: "generate audio"
    };

    static flowParametersSchema = {
        prompt: {
            type: "string",
            required: true
        },
        voiceId: {
            type: "string",
            required: true
        },
        modelName: {
            type: "string",
            required: true
        },
        voiceConfigs: {
            type: "object",
            required: false
        },
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let llmModule = apis.loadModule("llm");
            let audioBlob = await llmModule.textToSpeech(parameters.spaceId, {
                prompt: parameters.prompt,
                voice: parameters.voiceId,
                emotion: parameters.voiceConfigs.emotion,
                styleGuidance: parameters.voiceConfigs.styleGuidance,
                modelName: parameters.modelName
            });
            apis.success(audioBlob);
        } catch (e) {
            apis.fail(e);
        }
    }
}

module.exports = TextToSpeech;
