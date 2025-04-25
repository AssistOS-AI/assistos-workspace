const Binaries = require("./binaries");
const path = require("path");
const composeBinaryPath = (binary) => path.resolve(process.env.PERSISTENCE_FOLDER, `../binaries/${binary}.js`);

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

class Provider {
    constructor(name, models) {
        this.name = name
        this.models = models
    }

    async getModels() {
        return this.models
    }

    async getTextResponse(model, prompt, options = {}) {
        if (!this.models[model]) {
            throw new Error(`Provider ${this.name} does not support model ${model}`);
        }
        const args = buildArgs({
            subcommand: "generateText",
            model,
            promptOrMessages: prompt,
            options
        });
        let binariesPath = composeBinaryPath(this.name);
        return await Binaries.executeBinary(this.name, binariesPath, args);
    }

    async getTextStreamingResponse(model, prompt, options = {}, onDataChunk) {
        if (!this.models[model]) {
            throw new Error(`Provider ${this.name} does not support model ${model}`);
        }
        const args = buildArgs({
            subcommand: "generateTextStreaming",
            model,
            promptOrMessages: prompt,
            options,
            streaming: true
        });
        let binariesPath = composeBinaryPath(this.name);
        return await Binaries.executeBinaryStreaming(this.name, binariesPath, args, onDataChunk);
    }

    async getChatCompletionResponse(model, messages, options = {}) {
        if (!this.models[model]) {
            throw new Error(`Provider ${this.name} does not support model ${model}`);
        }
        const args = buildArgs({
            subcommand: "getChatCompletion",
            model,
            promptOrMessages: messages,
            options
        });
        let binariesPath = composeBinaryPath(this.name);
        return await Binaries.executeBinary(this.name, binariesPath, args);
    }

    async getChatCompletionStreamingResponse(model, messages, options = {}, onDataChunk) {
        if (!this.models[model]) {
            throw new Error(`Provider ${this.name} does not support model ${model}`);
        }
        const args = buildArgs({
            subcommand: "getChatCompletionStreaming",
            model,
            prompt: messages,
            options,
            streaming: true
        });
        const binariesPath = composeBinaryPath(this.name);
        return await Binaries.executeBinaryStreaming(this.name, binariesPath, args, onDataChunk);
    }

}

module.exports = Provider;