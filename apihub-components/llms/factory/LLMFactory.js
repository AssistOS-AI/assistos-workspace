const LLMs = {
    "GPT-3.5-Turbo": require('../models/text/GPT-3.5-Turbo'),
    "GPT-4": require('../models/text/GPT-4')
};
const Mixins = {
    "openAI": require('../mixins/openAI.js')
};

class LLMFactory {
    static createLLM(LLMName, config, apiKey, ...mixins) {
        const LLMClass = LLMs[LLMName];
        if (!LLMClass) {
            const error = new Error(`No LLM found with the name: ${LLMName}`);
            error.statusCode = 404;
            throw error;
        }

        let instance = new LLMClass(config, apiKey);

        mixins.forEach(mixinName => {
            const mixin = Mixins[mixinName];
            if (!mixin) {
                const error = new Error(`No mixin found with the name: ${mixinName}`);
                error.statusCode = 404;
                throw error;
            }
            mixin(instance);
        });

        return instance;
    }
}

module.exports = LLMFactory;