const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class GenerateText extends IFlow {
    static flowMetadata = {
        action: "Generates text based on some requirements",
        intent: "Generate text"
    };

    static flowParametersSchema = {
        requirements: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let llm = assistOS.space.getLLM();
            let prompt = `Please generate some text based on these requirements: ${parameters.requirements}`;
            let generatedText = await llm.request(prompt);
            apis.success(generatedText);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = GenerateText;
