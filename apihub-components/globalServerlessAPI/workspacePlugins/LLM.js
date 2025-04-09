async function ChatPlugin() {
    const self = {};
    const BinariesExecutor =  $$.loadPlugin("BinariesExecutor")

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

    self.getTextResponse = async (provider, apiKey, model, prompt, options = {}) => {
        const args = buildArgs({
            subcommand: "generateText",
            apiKey,
            model,
            promptOrMessages: prompt,
            options
        });
        return await BinariesExecutor.executeBinary(provider, args);
    }

    self.getTextStreamingResponse = async (provider, apiKey, model, prompt, options = {}, onDataChunk) => {
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

    self.getChatCompletionResponse = async (provider, apiKey, model, messages, options = {}) => {
        const args = buildArgs({
            subcommand: "getChatCompletion",
            apiKey,
            model,
            promptOrMessages: messages,
            options
        });
        return await BinariesExecutor.executeBinary(provider, args);
    }

    self.getChatCompletionStreamingResponse = async (provider, apiKey, model, messages, options = {}, onDataChunk) => {
        const args = buildArgs({
            subcommand: "getChatCompletionStreaming",
            apiKey,
            model,
            promptOrMessages: messages,
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
            singletonInstance = await ChatPlugin();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (globalUserId, email, command, ...args) {
            return true;
        }
    },
    getDependencies: function () {
        return ["Workspace", "BinariesExecutor"];
    }
};
