const OpenAILib = require('openai');
const streamEmitter = require('../utils/streamEmitter.js');

function createOpenAIInstance(apiKey) {
    if (!apiKey) {
        const error = new Error("API key not provided");
        error.statusCode = 400;
        throw error;
    }
    return new OpenAILib({ apiKey });
}

module.exports = function (modelInstance) {
    const OpenAI = createOpenAIInstance(modelInstance.apiKey);

    async function executeCompletion({ prompt, configs, withStream = false, messagesQueue = null }) {
        const {variants, temperature, maxTokens} = configs;
        const LLMRequestConfig = {
            model: modelInstance.getModelName(),
            messages: messagesQueue || (prompt ? [{ role: 'user', content: prompt }] : []),
            stream: withStream,
            ...(variants ? { n: variants } : {}),
            ...(temperature ? { temperature } : {}),
            ...(maxTokens ? { max_tokens: maxTokens } : {})
        };

        if (withStream) {
            const stream = await OpenAI.beta.chat.completions.stream(LLMRequestConfig);
            for await (const chunk of stream) {
                streamEmitter.emit('data', chunk.choices[0]?.delta?.content || '');
            }
            streamEmitter.emit('end');
            const response = await stream.finalChatCompletion();
            const messages = response.choices.map(choice => choice.message.content);
            delete response.choices;
            return {
                messages: messages,
                metadata: response
            };
        } else {
            const response = await OpenAI.chat.completions.create(LLMRequestConfig);
            const messages = response.choices.map(choice => choice.message.content);
            delete response.choices;
            return {
                messages: messages,
                metadata: response
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
