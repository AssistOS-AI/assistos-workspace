const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class ImproveText extends IFlow {
    static flowMetadata = {
        action: "Improves text based on some requirements",
        intent: "Generate text"
    };

    static flowParametersSchema = {
        spaceId:{
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
            let personaltyPrompt = "";
            let personalityLLM;
            if(parameters.personality){
                personalityLLM = parameters.personality.llms.text;
                personaltyPrompt = `You will play the role of a personality named: ${parameters.personality.name} which has this description ${parameters.personality.description}. You will approach the following instructions as this personality would. `;
            }
            let improveTextPrompt = "Please correct grammar, improve clarity, and reorganize ideas as needed for readability, while keeping the original meaning of the following text. ";
            let additionalPrompt = "";
            if(parameters.prompt){
                additionalPrompt = "Additionally, respect the following instructions " + parameters.prompt;
            }
            const structurePrompt = "Return only the corrected text. Do not add any new information or markings.";
            const llmModule = apis.loadModule("llm");
            let systemPrompt = personaltyPrompt + improveTextPrompt + parameters.text + " " + additionalPrompt + " " + structurePrompt;
            let textResult = await llmModule.generateText({
                prompt: systemPrompt,
                modelName: personalityLLM || "Qwen"
            }, parameters.spaceId);
            apis.success(textResult);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = ImproveText;
