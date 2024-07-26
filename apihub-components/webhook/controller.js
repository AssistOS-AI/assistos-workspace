const {generateId} = require("../apihub-component-utils/crypto");
const crypto = require('crypto');
const utils = require("../apihub-component-utils/utils");
const secret = generateId(32);
const space = require("../spaces-storage/space.js");
const eventPublisher = require("../subscribers/eventPublisher.js");
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
        const {timestamp, nonce, signature: receivedSignature, objectId, userId} = ref;
        const generatedSignature = generateSignature(timestamp, nonce);
        if (receivedSignature === generatedSignature) {
            if(objectId && request.body.status === "DONE"){
                let spaceId = objectId.split("_")[0];
                await space.APIs.putImage(spaceId, objectId, request.body.uri || request.body.imageData);
                if(request.body.buttons){
                    eventPublisher.notifyClientTask(userId, objectId, request.body.buttons);
                } else {
                    eventPublisher.notifyClientTask(userId, objectId);
                }
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
async function processBuffer() {

}
function getWebhookSecret() {
    return secret;
}

module.exports = {
    getWebhookSecret,
    dataHandler,
}