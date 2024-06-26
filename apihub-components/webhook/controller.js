const {generateId} = require("../apihub-component-utils/crypto");
const crypto = require('crypto');
const utils = require("../apihub-component-utils/utils");
const secret = generateId(32);
const {eventPublisher} = require("../subscribers");
function generateSignature(timestamp, nonce) {
    const data = timestamp + nonce + secret;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}
async function dataHandler(request, response) {
    try {
        if (!request.body.ref) {
            return utils.sendResponse(response, 401, "application/json", {
                success: false,
                message: "Unauthorized request"
            });
        }
        const ref = JSON.parse(request.body.ref);
        const {timestamp, nonce, signature: receivedSignature, userId, saveDataConfig} = ref;
        const generatedSignature = generateSignature(timestamp, nonce);
        if (receivedSignature === generatedSignature) {
            if(saveDataConfig){
                const module = require("assistos").loadModule(saveDataConfig.module);
                await module[saveDataConfig.fnName](...saveDataConfig.params, request.body);
            }
            if (request.body.status === "QUEUED" || request.body.status === "PROCESSING") {
                eventPublisher.notifyClient(userId, "content", request.body);
            } else if (request.body.status === "FAILED") {
                eventPublisher.notifyClient(userId, "content", request.body.error);
            } else if (request.body.status === "DONE") {
                eventPublisher.notifyClient(userId, "done", request.body);
            }
            return utils.sendResponse(response, 200, "application/json", {
                success: true
            });
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

module.exports = {
    getWebhookSecret,
    dataHandler,
}