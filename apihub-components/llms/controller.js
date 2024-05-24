const utils = require('../apihub-component-utils/utils.js');
const LLMStreamingEmitter= require('./__archived/utils/streamEmitter.js');
const { v4: uuidv4 } = require('uuid');
const secrets = require("../apihub-component-utils/secrets");

const cache = {};
async function sendRequest(url, method, request, response){
    const spaceId = request.params.spaceId;
    const LLMMap = require("./[MAP]LLMs.json");
    const configs = require("../config.json");
    const APIKeyObj = await secrets.getModelAPIKey(spaceId, LLMMap[request.body.modelName]);
    if (!APIKeyObj) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: "API key not found"
        });
    }
    let body = Object.assign({}, request.body);
    body.APIKey = APIKeyObj.value;

    let result;
    let init = {
        method: method,
        headers: {}
    };
    init.body = JSON.stringify(body);
    init.headers = {
        "Content-type": "application/json; charset=UTF-8"
    };
    if(configs.ENVIRONMENT_MODE === "production"){
        url = `${configs.LLMS_SERVER_PRODUCTION_BASE_URL}${url}`;
    } else {
        url = `${configs.LLMS_SERVER_DEVELOPMENT_BASE_URL}${url}`;
    }

    try {
        result = await fetch(url,init);
    } catch (error) {
        console.error(error);
    }

    let llmResponse = JSON.parse(await result.text());
    if(!llmResponse.success){
        console.error(llmResponse.message);
    }
    return llmResponse.data;
}
async function getTextResponse(request, response) {
    try {
        const modelResponse = await sendRequest(`/apis/v1/text/generate`, "POST", request, response);
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
    const sessionId  = request.body.sessionId;
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
        const modelResponse = await sendRequest(`/apis/v1/text/streaming/generate`, "POST", request, response);
        if(modelResponse.final){
            streamEmitter.emit('final', modelResponse.data);
        }
        if(!modelResponse) {
            streamEmitter.emit('end');
        }

        streamEmitter.emit('data', modelResponse);
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
async function getImageResponse(request, response) {
    try {
        const modelResponse = await sendRequest(`/apis/v1/image/generate`, "POST", request, response);
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
async function editImage(request, response) {
    try {
        const modelResponse = await sendRequest(`/apis/v1/image/edit`, "POST", request, response);
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
async function getImageVariants(request, response) {
    try {
        const modelResponse = await sendRequest(`/apis/v1/image/variants`, "POST", request, response);
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
async function getVideoResponse(request, response) {
    try {
        const modelResponse = await sendRequest(`/apis/v1/video/generate`, "POST", request, response);
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
async function getAudioResponse(request, response) {
    try {
        const modelResponse = await sendRequest(`/apis/v1/audio/generate`, "POST", request, response);
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
module.exports = {
    getTextResponse,
    getTextStreamingResponse,
    getImageResponse,
    editImage,
    getImageVariants,
    getVideoResponse,
    getAudioResponse
};
