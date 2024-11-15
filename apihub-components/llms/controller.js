const utils = require('../apihub-component-utils/utils.js');
const secrets = require("../apihub-component-utils/secrets");
const axios = require('axios');
const cache = {};
const {pipeline} = require('stream');
const {getWebhookSecret} = require("../webhook/controller");
const configs = require("../../data-volume/config/config.json");
let LLMConfigs;


async function getLLMAuthRequirements() {
    let baseURL;
    if (configs.ENVIRONMENT_MODE === "production") {
        baseURL = configs.LLMS_SERVER_PRODUCTION_BASE_URL;
    } else {
        baseURL = configs.LLMS_SERVER_DEVELOPMENT_BASE_URL;
    }
    try {
        const llmAuthRequirements = await fetch(`${baseURL}/apis/v1/authRequirements`, {
            method: "GET",
            headers: {
                "content-type": "application/json"
            },
        });
        let textResult = await llmAuthRequirements.text();
        let data = JSON.parse(textResult).data;
        LLMConfigs = JSON.parse(data);
    } catch (error) {
        console.error(error);
    }
}

async function getLLMConfigs() {
    if (!LLMConfigs) {
        await getLLMAuthRequirements();
    }
    return LLMConfigs;
}

async function sendLLMConfigs(request, response) {
    let configs = await getLLMConfigs();
    return utils.sendResponse(response, 200, "application/json", {
        data: configs
    });
}

async function constructRequestInitAndURL(url, method, request, response) {
    const spaceId = request.params.spaceId;
    const configs = require("../../data-volume/config/config.json");
    let companyObj;
    let LLMConfigs = await getLLMConfigs();

    if (request.body?.modelName) {
        companyObj = LLMConfigs.find(company => company.models.some(model => model.name === request.body.modelName));
    } else if (request.body?.company) {
        companyObj = LLMConfigs.find((companyObj) => companyObj.company === request.body.company);
    }

    let body = Object.assign({}, request.body || {});

    if (companyObj) {
        const APIKeyObj = await secrets.getModelAPIKey(spaceId, companyObj.company);
        if (!APIKeyObj) {
            return utils.sendResponse(response, 500, "application/json", {
                message: "API key not found"
            });
        }
        for (let key of companyObj.authentication) {
            body[key] = APIKeyObj[key];
        }
    }

    let init = {
        method: method,
        headers: {}
    };

    if (Object.keys(body).length !== 0) {
        init.body = JSON.stringify(body);
    }
    init.headers = {
        "Content-type": "application/json; charset=UTF-8"
    };
    let fullURL;
    if (configs.ENVIRONMENT_MODE === "production") {
        fullURL = `${configs.LLMS_SERVER_PRODUCTION_BASE_URL}${url}`;
    } else {
        fullURL = `${configs.LLMS_SERVER_DEVELOPMENT_BASE_URL}${url}`;
    }
    return {fullURL, init};
}

async function sendRequest(url, method, request, response) {
    let {fullURL, init} = await constructRequestInitAndURL(url, method, request, response);
    let result;
    try {
        result = await fetch(fullURL, init);
    } catch (error) {
        console.error(error);
    }
    let llmResponse = await result.json();
    if (!result.ok) {
        const error = new Error(llmResponse.message);
        error.statusCode = result.status;
        throw error
    }
    return llmResponse.data;
}

async function getTextResponse(request, response) {
    try {
        const modelResponse = await sendRequest(`/apis/v1/text/generate`, "POST", request, response);
        utils.sendResponse(response, 200, "application/json", {
            data: modelResponse
        });
        return {success: true, data: modelResponse};
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: error.message
        });
        return {success: false, message: error.message};
    }
}

async function getChatResponse(request, response) {
    try {
        const modelResponse= await sendRequest(`/apis/v1/chat/generate`, "POST", request, response);
        return utils.sendResponse(response, 200, "application/json", {
            data: modelResponse
        });
    }catch(error){
        return utils.sendResponse(response,error.statusCode || 500, "application/json", {
            message: error.message
        })
    }
}

async function getTextStreamingResponse(request, response) {
    const requestData = {...request.body};
    let sessionId = requestData.sessionId || null;
    const {
        fullURL,
        init
    } = await constructRequestInitAndURL(`/apis/v1/text/streaming/generate`, "POST", request, response);

    response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    init.responseType = 'stream';
    const requestBody = init.body;
    delete init.body;

    return new Promise((resolve, reject) => {
        axios.post(fullURL, requestBody, init).then(llmRes => {
            let metadata = null;

            llmRes.data.on('data', chunk => {
                try {
                    const dataStr = chunk.toString();
                    const lines = dataStr.split('\n');
                    let eventName = null;
                    let eventData = '';

                    lines.forEach(line => {
                        if (line.startsWith('event:')) {
                            eventName = line.replace('event: ', '').trim();
                        } else if (line.startsWith('data:')) {
                            eventData += line.replace('data: ', '').trim();
                        } else if (line.trim() === '') {
                            if (eventData) {
                                const dataObj = JSON.parse(eventData);

                                if (eventName === 'beginSession' && dataObj.sessionId && !sessionId) {
                                    sessionId = dataObj.sessionId;
                                    cache[sessionId] = {data: "", lastSentIndex: 0, end: false};
                                    response.write(`event: beginSession\ndata: ${JSON.stringify({sessionId})}\n\n`);
                                } else if (eventName === 'end') {
                                    if (sessionId) {
                                        cache[sessionId].end = true;
                                        response.write(`event: end\ndata: ${JSON.stringify({
                                            fullResponse: dataObj.fullResponse,
                                            metadata: dataObj.metadata
                                        })}\n\n`);
                                        response.end();
                                        delete cache[sessionId];
                                        resolve({
                                            success: true,
                                            data: {messages: dataObj.fullResponse, metadata: metadata}
                                        });
                                    }
                                } else {
                                    if (dataObj.message) {
                                        cache[sessionId].data += dataObj.message;
                                        response.write(`data: ${JSON.stringify({message: dataObj.message})}\n\n`);
                                    }
                                }

                                eventName = null;
                                eventData = '';
                            }
                        }
                    });
                } catch (err) {
                    console.error('Failed to parse JSON:', err);
                }
            });
        }).catch(error => {
            console.error(error);
            if (!response.headersSent) {
                response.writeHead(500, {'Content-Type': 'application/json'});
            }
            response.end(JSON.stringify({message: error.message}));
            reject(error);
        });
    });
}

async function getImageResponse(request, response) {
    try {
        request.body.webhookSecret = getWebhookSecret();
        request.body.spaceId = request.params.spaceId;
        request.body.userId = request.userId;
        let imagesIds = await sendRequest(`/apis/v1/image/generate`, "POST", request, response);
        utils.sendResponse(response, 200, "application/json", {
            data: imagesIds
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: error.message
        });
    }
}

async function editImage(request, response) {
    try {
        request.body.webhookSecret = getWebhookSecret();
        request.body.spaceId = request.params.spaceId;
        request.body.userId = request.userId;
        const modelResponse = await sendRequest(`/apis/v1/image/edit`, "POST", request, response);
        utils.sendResponse(response, 200, "application/json", {
            data: modelResponse
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: error.message
        });
    }
}

async function getImageVariants(request, response) {
    try {
        const modelResponse = await sendRequest(`/apis/v1/image/variants`, "POST", request, response);
        utils.sendResponse(response, 200, "application/json", {
            data: modelResponse
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: error.message
        });
    }
}

async function getVideoResponse(request, response) {
    try {
        const modelResponse = await sendRequest(`/apis/v1/video/generate`, "POST", request, response);
        utils.sendResponse(response, 200, "application/json", {
            data: modelResponse
        });
        modelResponse.body.pipe(response);
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: error.message
        });
    }
}

async function getAudioResponse(request, response) {
    const {
        fullURL,
        init
    } = await constructRequestInitAndURL(`/apis/v1/audio/generate`, "POST", request, response);
    const modelResponse = await fetch(fullURL, init);
    if (!modelResponse.ok) {
        let jsonMessage = await modelResponse.json();
        return utils.sendResponse(response, modelResponse.status || 500, "application/json", {
            message: jsonMessage.message
        });
    }
    response.setHeader("Content-Type", "audio/mpeg");
    await $$.promisify(pipeline)(modelResponse.body, response);
}

async function listVoices(request, response) {
    try {
        request.body = {};
        request.body.modelName = "PlayHT2.0";
        let result = await sendRequest(`/apis/v1/audio/listVoices`, "POST", request, response);
        return utils.sendResponse(response, 200, "application/json", {
            data: result
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: error.message
        });
    }
}

async function listEmotions(request, response) {
    try {
        let url = `/apis/v1/audio/listEmotions`;
        if (configs.ENVIRONMENT_MODE === "production") {
            url = `${configs.LLMS_SERVER_PRODUCTION_BASE_URL}${url}`;
        } else {
            url = `${configs.LLMS_SERVER_DEVELOPMENT_BASE_URL}${url}`;
        }
        let llmResponse;
        let body = {
            modelName: "PlayHT2.0",
        }
        try {
            llmResponse = await fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(body)
            });
        } catch (error) {
            console.error(error);
        }

        let responseJSON = await llmResponse.json();
        if (!llmResponse.ok) {
            utils.sendResponse(response, llmResponse.status || 500, "application/json", {
                message: responseJSON.message
            });
        }
        return utils.sendResponse(response, 200, "application/json", {
            data: responseJSON.data
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: error.message
        });
    }
}

async function lipsync(request, response) {
    try {
        request.body = {
            modelName: request.body.modelName,
            webHookData: {
                webhookSecret: getWebhookSecret(),
                taskId: request.body.taskId
            },
            audioId: request.body.audioId,
            videoId: request.body.videoId
        };
        await sendRequest(`/apis/v1/video/lipsync`, "POST", request, response);
        return utils.sendResponse(response, 200, "application/json", {});
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: error.message
        });
    }
}

async function listLlms(request, response) {
    try {
        let result = await sendRequest(`/apis/v1/llms`, "GET", request, response);
        return utils.sendResponse(response, 200, "application/json", {
            data: result
        });
    } catch (error) {
        return utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: error.message
        })
    }
}

module.exports = {
    getTextResponse,
    getChatResponse,
    getTextStreamingResponse,
    getImageResponse,
    editImage,
    getImageVariants,
    getVideoResponse,
    getAudioResponse,
    listVoices,
    getLLMConfigs,
    sendLLMConfigs,
    listEmotions,
    lipsync,
    listLlms
};
