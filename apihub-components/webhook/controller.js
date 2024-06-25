const {generateId} = require("../apihub-component-utils/crypto");
const crypto = require('crypto');
const utils = require("../apihub-component-utils/utils");
let clients = [];
const secret = generateId(32);

function generateSignature(timestamp, nonce) {
    const data = timestamp + nonce + secret;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

async function notifyClient(request, response) {
    try {
        console.log("entered");
        if (!request.body.ref) {
            return utils.sendResponse(response, 401, "application/json", {
                success: false,
                message: "Unauthorized request"
            });
        }
        const ref = JSON.parse(request.body.ref);
        const {timestamp, nonce, signature: receivedSignature, clientId} = ref;
        const generatedSignature = generateSignature(timestamp, nonce);
        if (receivedSignature === generatedSignature) {
            let client = clients.find(client => client.clientId === clientId);
            if(request.body.status === "QUEUED"){
                const message = JSON.stringify(request.body);
                client.res.write("event: update\n");
                client.res.write(`data: ${message}\n\n`);
                return utils.sendResponse(response, 200, "application/json", {
                    success: true
                });
            }
            if (request.body.status === "PROCESSING") {
                const message = JSON.stringify(request.body);
                client.res.write("event: update\n");
                client.res.write(`data: ${message}\n\n`);
                return utils.sendResponse(response, 200, "application/json", {
                    success: true
                });
            }
            if (request.body.status === "FAILED") {
                client.res.write("event: update\n");
                client.res.write(`data: ${request.body.error}\n\n`);
                return utils.sendResponse(response, 200, "application/json", {
                    success: true
                });
            }
            if(request.body.status === "DONE"){
                const message = JSON.stringify(request.body);
                client.res.write("event: done\n");
                client.res.write(`data: ${message}\n\n`);
                return utils.sendResponse(response, 200, "application/json", {
                    success: true
                });
            }
        } else {
            return utils.sendResponse(response, 401, "application/json", {
                success: false,
                message: "Unauthorized request"
            });
        }
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            success: false,
            message: "Internal server error"
        });
    }
}

function getWebhookSecret() {
    return secret;
}

async function registerClient(request, response) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders();
    clients.push({res: response, clientId: request.params.clientId});
    request.on('close', () => {
        clients = clients.filter(client => client.res !== response);
        clearInterval(intervalId);
        response.end();
    });
    const intervalId = setInterval(() => {
        response.write("event: message\n");
        response.write('data: keep-alive\n\n');
    }, 5000);
    response.on('error', (err) => {
        clearInterval(intervalId);
        console.error('Server SSE error:', err);
        response.end();
    });
}

module.exports = {
    getWebhookSecret,
    notifyClient,
    registerClient
}