async function LLM() {
    const self = {};

    const BinariesExecutor = $$.loadPlugin("BinariesExecutor")
    const persistence = await $$.loadPlugin("SpaceInstancePersistence");

    await persistence.configureTypes({
        llm: {
            id: "random",
            name: "string",
            provider: "string",
            type: "string",
            capabilities: "array string",
            description: "string",
            pricing: "object",
            contextWindow: "integer",
            knowledgeCuttoff: "date"
        }
    })
    await persistence.createIndex("llm", "id");

    const buildArgs = function ({
                                    subcommand,
                                    apiKey,
                                    model,
                                    promptOrMessages,
                                    options = {},
                                    streaming = false
                                }) {
        const args = [subcommand, "-k", apiKey, "-m", model];

        if (typeof promptOrMessages === 'string') {
            args.push("-p", promptOrMessages);
        } else {
            args.push("-p", JSON.stringify(promptOrMessages));
        }

        if (streaming) args.push("--stream");

        if (options.temperature !== undefined) args.push("--temperature", options.temperature)
        if (options.top_p !== undefined) args.push("--top_p", options.top_p)
        if (options.frequency_penalty !== undefined) args.push("--frequency_penalty", options.frequency_penalty)
        if (options.presence_penalty !== undefined) args.push("--presence_penalty", options.presence_penalty)
        if (options.stop !== undefined) args.push("--stop", options.stop)
        if (options.max_tokens !== undefined) args.push("--max_tokens", options.max_tokens)

        return args;
    }

    self.getRandomLlm = async function () {
        const llms = await persistence.getEveryLlmObject();
        if (llms.length === 0) {
            return null;
        }
        for(let llm of llms){
            if(llm.provider=== "OpenAI" && llm.name === "gpt-4o"){
                return llm;
            }
        }
    }

    self.getModels= async function () {
        return await persistence.getEveryLlmObject();
    }
    self.getProviderModels = async function (provider) {
        const llms = await persistence.getEveryLlmObject();
        return llms.filter(llm => llm.provider === provider);
    }

    self.getLlmById = async function (id) {
        return await persistence.getLlm(id);
    }

    self.getLlmByName = async function (name) {
        const llms = persistence.getEveryLlmObject();
        for (const llm of llms) {
            if (llm.name === name) {
                return llm;
            }
        }
    }

    self.getTextResponse = async ({provider, apiKey, model, prompt, options = {}}) => {
        const args = buildArgs({
            subcommand: "generateText",
            apiKey,
            model,
            promptOrMessages: prompt,
            options
        });
        return await BinariesExecutor.executeBinary(provider, args);
    }

    self.getTextStreamingResponse = async ({provider, apiKey, model, prompt, options = {}, onDataChunk}) => {

        const args = buildArgs({
            subcommand: "generateTextStreaming",
            apiKey,
            model,
            promptOrMessages: prompt,
            options,
            streaming: true
        });
        await BinariesExecutor.executeBinaryStreaming(provider, args, onDataChunk);
    }

    self.getChatCompletionResponse = async ({provider, apiKey, model, messages, options = {}}) => {

        const args = buildArgs({
            subcommand: "getChatCompletion",
            apiKey,
            model,
            promptOrMessages: messages,
            options
        });
        return await BinariesExecutor.executeBinary(provider, args);
    }

    self.getChatCompletionStreamingResponse = async ({
                                                         provider,
                                                         apiKey,
                                                         model,
                                                         messages,
                                                         options = {},
                                                         onDataChunk
                                                     }) => {

        const args = buildArgs({
            subcommand: "getChatCompletionStreaming",
            apiKey,
            model,
            prompt: messages,
            options,
            streaming: true
        });
        await BinariesExecutor.executeBinaryStreaming(provider, args, onDataChunk);
    }

    return self;
}

let singletonInstance;

module.exports = {
    getInstance: async function () {
        if (!singletonInstance) {
            singletonInstance = await LLM();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (globalUserId, email, command, ...args) {
            return true;
        }
    },
    getDependencies: function () {
        return ["Workspace", "BinariesExecutor", "SpaceInstancePersistence"];
    }
};
