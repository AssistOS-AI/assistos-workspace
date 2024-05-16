const utils = require('../apihub-component-utils/utils.js');
const Text = require("./handlers/Text.js");
const LLMStreamingEmitter= require('./utils/streamEmitter.js');
const { v4: uuidv4 } = require('uuid');

const cache = {};

async function getTextResponse(request, response) {
    const { modelName, prompt, messagesQueue, modelConfig} = request.body;
    const spaceId = request.params.spaceId;

    if (!modelName) {
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Bad Request. Model name is required"
        });
    }
    if(!prompt){
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Bad Request. Prompt is required"
        });
    }
    try {
        const modelResponse = await Text.APIs.getTextResponse(spaceId, modelName, prompt, modelConfig, messagesQueue);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: modelResponse
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function getTextStreamingResponse(request, response) {
    const { modelName, prompt, messagesQueue, modelConfig, sessionId } = request.body;
    const spaceId = request.params.spaceId;

    if (!modelName) {
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Bad Request. Model name is required"
        });
    }
    if(!prompt){
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Bad Request. Prompt is required"
        });
    }

    if (sessionId && cache[sessionId]) {
        const sessionData = cache[sessionId];
        const newData = sessionData.data.slice(sessionData.lastSentIndex);
        sessionData.lastSentIndex = sessionData.data.length;
        const isEnd = sessionData.end || false;

        if (isEnd) {
            delete cache[sessionId];
        }

        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: newData,
            end: isEnd
        });
    }

    const newSessionId = uuidv4();
    cache[newSessionId] = { data: '', lastSentIndex: 0 };
    const streamEmitter = new LLMStreamingEmitter();

    streamEmitter.on('data', data => {
        cache[newSessionId].data += data;
    });

    streamEmitter.on('end', () => {
        cache[newSessionId].end = true;
    });

    streamEmitter.on('final', finalData => {
        cache[newSessionId].data += finalData.messages.join('');
    });

    try {
        await Text.APIs.getTextStreamingResponse(spaceId, modelName, prompt, modelConfig, messagesQueue, streamEmitter);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            sessionId: newSessionId,
            data: cache[newSessionId].data,
            end: cache[newSessionId].end || false
        });
    } catch (error) {
        delete cache[newSessionId];
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    getTextResponse,
    getTextStreamingResponse
};
