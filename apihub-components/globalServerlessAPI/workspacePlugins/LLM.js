async function LLM(Provider) {
    const self = {};

    const persistence = await $$.loadPlugin("DefaultPersistence");

    await persistence.configureTypes({
        llm: {
            id: "random",
            name: "string",
            provider: "provider",
            type: "string",
            capabilities: "array string",
            description: "string",
            pricing: "object",
            contextWindow: "integer",
            knowledgeCuttoff: "date"
        },
        provider: {
            id: "random",
            name: "string",
            models: "array llm"
        }
    })

    await persistence.createIndex("llm", "name");
    await persistence.createIndex("provider", "name");

    const getProvider = async function (providerName) {
        const provider = await persistence.getProviderByName(providerName);
        if (!provider) {
            throw new Error(`Provider ${providerName} not found`);
        }
        return new Provider(provider.name, provider.models);
    }
    self.getProvider= async function (providerName) {
        return await getProvider(providerName);
    }
    self.getModels = async function () {
        return await persistence.getEveryLlmObject();
    }

    self.getProviderModels = async function (providerName) {
        const provider = await getProvider(providerName);
        return provider.models;
    }

    self.getLlmByName = async function (name) {
        return await persistence.getLlmByName(name);
    }

    self.getTextResponse = async (provider, model, prompt, options = {}) => {
        const Provider = await getProvider(provider)
        return await Provider.getTextResponse(model, prompt, options);
    }

    self.getTextStreamingResponse = async (provider, model, prompt, options = {}, onDataChunk) => {
        const Provider = await getProvider(provider)
        return await Provider.getTextStreamingResponse(model, prompt, options, onDataChunk);
    }

    self.getChatCompletionResponse = async (provider, model, messages, options = {}) => {
        const Provider = await getProvider(provider)
        return await Provider.getChatCompletionResponse(model, messages, options);
    }

    self.getChatCompletionStreamingResponse = async (provider, model, messages, options = {}, onDataChunk) => {
        const Provider = await getProvider(provider)
        return await Provider.getChatCompletionResponse(model, messages, options, onDataChunk);
    }

    return self;
}

let singletonInstance;

module.exports = {
    getInstance: async function (Provider) {
        if(!Provider) {
            Provider = require('../../apihub-component-utils/provider.js')
        }
        if (!singletonInstance) {
            singletonInstance = await LLM(Provider);
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (globalUserId, email, command, ...args) {
            return true;
        }
    },
    getDependencies: function () {
        return ["DefaultPersistence"];
    }
};
