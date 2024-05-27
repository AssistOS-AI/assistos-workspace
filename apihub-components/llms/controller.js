const utils = require('../apihub-component-utils/utils.js');
const {v4: uuidv4} = require('uuid');
const secrets = require("../apihub-component-utils/secrets");
const axios = require('axios');
const LLMMap = require("./[MAP]LLMs.json");
const cache = {};

async function sendRequest(url, method, request, response) {
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
    if (configs.ENVIRONMENT_MODE === "production") {
        url = `${configs.LLMS_SERVER_PRODUCTION_BASE_URL}${url}`;
    } else {
        url = `${configs.LLMS_SERVER_DEVELOPMENT_BASE_URL}${url}`;
    }

    try {
        result = await fetch(url, init);
    } catch (error) {
        console.error(error);
    }

    let llmResponse = JSON.parse(await result.text());
    if (!llmResponse.success) {
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
    const requestData = { ...request.body };
    let sessionId = requestData.sessionId || null;
    const APIKeyObj = await secrets.getModelAPIKey(request.params.spaceId, LLMMap[request.body.modelName]);
    requestData.APIKey = APIKeyObj.value;

    response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    try {
        const llmRes = await axios.post('http://localhost:8079/apis/v1/text/streaming/generate', requestData, {
            headers: {
                'Content-Type': 'application/json'
            },
            responseType: 'stream'
        });

        llmRes.data.on('data', chunk => {
            try {
                const dataStr = chunk.toString();
                if (dataStr.startsWith('data:')) {
                    const dataObj = JSON.parse(dataStr.slice(5));
                    if (dataObj.sessionId && !sessionId) {
                        sessionId = dataObj.sessionId;
                        cache[sessionId] = { data: "", lastSentIndex: 0, end: false };
                        response.write(`data: ${JSON.stringify({ sessionId })}\n\n`);
                    }
                    if (dataObj.message) {
                        cache[sessionId].data += dataObj.message;
                        response.write(`data: ${JSON.stringify({ message: dataObj.message })}\n\n`);
                    }
                }
            } catch (err) {
                console.error('Failed to parse JSON:', err);
            }
        });

        llmRes.data.on('end', () => {
            if (sessionId) {
                const finalMessage = cache[sessionId].data;
                cache[sessionId].end = true;
                response.write(`event: end\ndata: {}\n\n`);
                response.end();
                delete cache[sessionId];
            }
        });

    } catch (error) {
        console.error(error);
        if (!response.headersSent) {
            response.writeHead(500, { 'Content-Type': 'application/json' });
        }
        response.end(JSON.stringify({ success: false, message: error.message }));
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
