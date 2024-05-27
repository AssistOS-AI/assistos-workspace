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
    const sessionId = requestData.sessionId || null;
    const APIKeyObj = await secrets.getModelAPIKey(request.params.spaceId, LLMMap[request.body.modelName]);
    requestData.APIKey = APIKeyObj.value;

    if (sessionId && cache[sessionId]) {
        const sessionData = cache[sessionId];
        const newData = sessionData.data.slice(sessionData.lastSentIndex);
        sessionData.lastSentIndex = sessionData.data.length;
        const isEnd = sessionData.end || false;

        if (isEnd) {
            delete cache[sessionId];
        }

        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');

        if (newData) {
            response.write(`data: ${newData}\n\n`);
        }

        if (isEnd) {
            response.write('event: end\ndata: {}\n\n');
            response.end();
        }

        return;
    }

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
            const lines = chunk.toString().split('\n');
            lines.forEach(line => {
                if (line.startsWith('data: ')) {
                    const jsonData = line.slice(6); // Elimina "data: "
                    if (jsonData.trim()) {
                        try {
                            const parsedData = JSON.parse(jsonData);
                            if (parsedData.sessionId) {
                                requestData.sessionId = parsedData.sessionId;
                                cache[parsedData.sessionId] = { data: '', lastSentIndex: 0 };
                            } else {
                                response.write(`data: ${jsonData}\n\n`);
                                if (requestData.sessionId) {
                                    cache[requestData.sessionId].data += jsonData;
                                }
                            }
                        } catch (err) {
                            response.write(`data: ${jsonData}\n\n`);
                            if (requestData.sessionId) {
                                cache[requestData.sessionId].data += jsonData;
                            }
                        }
                    }
                } else if (line.trim()) {
                    response.write(`data: ${line}\n\n`);
                    if (requestData.sessionId) {
                        cache[requestData.sessionId].data += line;
                    }
                }
            });
        });

        llmRes.data.on('end', () => {
            if (requestData.sessionId) {
                const finalMessage = cache[requestData.sessionId].data;
                cache[requestData.sessionId].end = true;
                response.write(`event: complete\ndata: ${JSON.stringify({ message: finalMessage })}\n\n`);
            }
            response.write('event: end\ndata: {}\n\n');
            response.end();
        });

        llmRes.data.on('close', () => {
            if (requestData.sessionId) {
                cache[requestData.sessionId].end = true;
            }
            response.end();
        });

    } catch (error) {
        console.error(error);
        utils.sendResponse(response, 500, "application/json", { success: false, message: error.message });
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
