const utils = require('../apihub-component-utils/utils.js');
const {v4: uuidv4} = require('uuid');
const secrets = require("../apihub-component-utils/secrets");
const axios = require('axios');
const cache = {};
const {pipeline} = require('stream');
const {getWebhookSecret} = require("../webhook/controller");
let LLMConfigs;

async function getLLMAuthRequirements() {
    try {
        const llmAuthRequirements = await fetch(`http://localhost:8079/apis/v1/authRequirements`, {
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
        success: true,
        data: configs
    });
}

async function constructRequestInitAndURL(url, method, request, response) {
    const spaceId = request.params.spaceId;
    const configs = require("../config.json");
    let companyObj;
    let LLMConfigs = await getLLMConfigs();
    if (request.body.modelName) {
        companyObj = LLMConfigs.find(company => company.models.some(model => model.name === request.body.modelName));
    } else if (request.body.company) {
        companyObj = LLMConfigs.find((companyObj) => companyObj.company === request.body.company);
    } else {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: "LLM name or company name must be provided in the request body"
        });
    }
    if (!companyObj) {
        return utils.sendResponse(response, 404, "application/json", {
            success: false,
            message: "Api key not set"
        });
    }
    const APIKeyObj = await secrets.getModelAPIKey(spaceId, companyObj.company);
    if (!APIKeyObj) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: "API key not found"
        });
    }
    let body = Object.assign({}, request.body);

    for (let key of companyObj.authentication) {
        body[key] = APIKeyObj[key];
    }

    let init = {
        method: method,
        headers: {}
    };
    init.body = JSON.stringify(body);
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

    let llmResponse = JSON.parse(await result.text());
    if (!llmResponse.success) {
        throw new Error(llmResponse.message);
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
        return {success: true, data: modelResponse};
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            success: false,
            message: error.message
        });
        return {success: false, message: error.message};
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
                                        resolve({success: true, data: {messages:dataObj.fullResponse, metadata: metadata}});
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
            response.end(JSON.stringify({success: false, message: error.message}));
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
            success: true,
            data: imagesIds
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
        request.body.webhookSecret = getWebhookSecret();
        request.body.spaceId = request.params.spaceId;
        request.body.userId = request.userId;
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
        modelResponse.body.pipe(response);
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            success: false,
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
    if(!modelResponse.ok){
        let jsonMessage = await modelResponse.json();
        return utils.sendResponse(response, modelResponse.statusCode || 500, "application/json", {
            success: false,
            message: jsonMessage.message
        });
    }
    await $$.promisify(pipeline)(modelResponse.body, response);
}

async function listVoicesAndEmotions(request, response) {
    try {
        request.body = {};
        request.body.company = "PlayHT";
        let result = await sendRequest(`/apis/v1/audio/listVoicesAndEmotions`, "POST", request, response);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: result
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
    getAudioResponse,
    listVoicesAndEmotions,
    getLLMConfigs,
    sendLLMConfigs
};
