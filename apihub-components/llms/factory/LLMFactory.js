const LLMs = {
    "GPT-3.5-Turbo": require('../models/text/GPT-3.5-Turbo'),
    "GPT-4": require('../models/text/GPT-4')
};

export class LLMFactory {
    static createLLM(llmName, config, ...mixins) {
        const LLMClass = LLMs[llmName];
        if (!LLMClass) {
            throw new Error(`No LLM found with the name: ${llmName}`);
        }

        let instance = new LLMClass(config);

        mixins.forEach(mixin => {
            instance = mixin(instance);
        });

        return instance;
    }
}
