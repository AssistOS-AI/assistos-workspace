const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class ImproveText extends IFlow {
    static flowMetadata = {
        action: "Improves text based on some requirements",
        intent: "Generate text"
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        personality: {
            type: "object"
        },
        text: {
            type: "string",
            required: true
        },
        prompt: {
            type: "string"
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let improveTextPrompt = "Please correct grammar, improve clarity, and reorganize ideas as needed for readability, while keeping the original meaning of the following text. ";
            let additionalPrompt = "";
            if (parameters.prompt) {
                additionalPrompt = "Additionally, respect the following instructions " + parameters.prompt;
            }
            const structurePrompt = "Return only the corrected text. Do not add any new information or markings.";
            const llmModule = apis.loadModule("llm");
            let systemPrompt = improveTextPrompt + parameters.text + " " + additionalPrompt + " " + structurePrompt;
            let response= await llmModule.generateText(parameters.spaceId,systemPrompt,parameters.personality);
            apis.success(response.message);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = ImproveText;
