const anthropicLib = require("@anthropic-ai/sdk");
const streamEmitter = require('../../utils/streamEmitter.js');

function createAnthropicInstance(apiKey) {
    if (!apiKey) {
        const error = new Error("API key not provided");
        error.statusCode = 400;
        throw error;
    }
    return new anthropicLib({ apiKey: apiKey });
}

module.exports = function (modelInstance) {
    const Anthropic = createAnthropicInstance(modelInstance.apiKey);

    async function executeCompletion({ prompt, configs, withStream = false, messagesQueue = null }) {
        const { temperature, maxTokens } = configs;
        const LLMRequestConfig = {
            model: modelInstance.getModelName(),
            prompt: JSON.stringify(messagesQueue),
            stream: withStream,
            ...(temperature ? { temperature } : {}),
            ...(maxTokens ? { max_tokens_to_sample: maxTokens } : {})
        };

        if (withStream) {
            const stream = await Anthropic.completions.stream(LLMRequestConfig);
            for await (const chunk of stream) {
                streamEmitter.emit('data', chunk.completion || '');
            }
            streamEmitter.emit('end');
            const response = await stream.completion();
            return {
                messages: [response],
                metadata: {}
            };
        } else {
            const response = await Anthropic.completions.create(LLMRequestConfig);
            return {
                messages: [response.completion],
                metadata: {}
            };
        }
    }

    modelInstance.getResponse = function (prompt, configs) {
        return executeCompletion({ prompt, configs });
    };

    modelInstance.getStreamingResponse = function (prompt, configs) {
        return executeCompletion({ prompt, configs, withStream: true });
    };

    modelInstance.getResponseWithHistory = function (messagesQueue, configs = {}) {
        return executeCompletion({ configs, messagesQueue });
    };

    modelInstance.getStreamingResponseWithHistory = function (messagesQueue, configs = {}) {
        return executeCompletion({ configs, messagesQueue, withStream: true });
    };
}