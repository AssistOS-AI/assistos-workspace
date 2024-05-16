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
    "DALL-E-3": {
        instance: require('../models/image/DALL-E-3'),
        defaultMixins:[
            'openAIImage'
        ],
        defaultConfig:{}
    },
    "DALL-E-2": {
        instance: require('../models/image/DALL-E-2')
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
    "openAI_Text": require('../mixins/OpenAI/Text'),
    "openAI_Image": require('../mixins/OpenAI/Image.js'),
   " anthropic": require('../mixins/Anthropic/anthropic.js'),
    "google": require('../mixins/Google/google.js'),

};

class LLMFactory {
    static createLLM(LLMName,apiKey,config,...mixins) {
        const LLMClass = LLMs[LLMName];
        if (!LLMClass) {
            const error = new Error(`No LLM found with the name: ${LLMName}`);
            error.statusCode = 404;
            throw error;
        }
        mixins = [...LLMClass.defaultMixins, ...mixins];

        if(typeof config !== 'object'){
            const error = new Error(`Config must be an object`);
            error.statusCode = 400;
            throw error;
        }

        if(!config){
            config = LLMClass.instance.defaultConfig;
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
