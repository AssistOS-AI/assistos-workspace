const LLMs = {
    "GPT-3.5-Turbo": {
        instance: require('../models/text/GPT-3.5-Turbo'),
    },
    "GPT-4": {
        instance: require('../models/text/GPT-4')
    },
    "GPT-4-Turbo": {
        instance: require('../models/text/GPT-4-Turbo')
    },
    "GPT-4o": {
        instance: require('../models/text/GPT-4o')
    },
    "Claude-3": {
        instance: require('../models/text/Claude-3')
    },
    "Claude-2": {
        instance: require('../models/text/Claude-2')
    },
    "Gemini": {
        instance: require('../models/text/Gemini')
    }
};
const Mixins = {
    "openAI": require('../mixins/openAI.js'),
    "anthropic": require('../mixins/anthropic.js'),
    "google": require('../mixins/google.js'),
};

class LLMFactory {
    static createLLM(LLMName, config, apiKey, ...mixins) {
        const LLMClass = LLMs[LLMName];
        if (!LLMClass) {
            const error = new Error(`No LLM found with the name: ${LLMName}`);
            error.statusCode = 404;
            throw error;
        }

        let instance = new LLMClass.instance(config, apiKey);

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
