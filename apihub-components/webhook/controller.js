const {generateId} = require("../apihub-component-utils/crypto");
const crypto = require('crypto');
const utils = require("../apihub-component-utils/utils");
const secret = generateId(32);
const space = require("../space/space.js");
const subscriptionManager = require("../subscribers/SubscriptionManager.js");
const Storage = require("../apihub-component-utils/storage.js");
function generateSignature(timestamp, nonce) {
    const data = timestamp + nonce + secret;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function extractRefFromRequest(request) {
    let ref;
    if (request.body.ref) {
        ref = JSON.parse(request.body.ref);
    } else {
        ref = JSON.parse(decodeURIComponent(request.query.ref));
    }
    return ref;
}

async function saveResult(ref,requestBody) {
    const userId = ref.userId;
    const objectId = ref.objectId;

    switch (ref.type) {
        case "video":
            const taskId = ref.taskId;
            const videoURL = requestBody.outputUrl;
            const taskManager = require("../tasks/TaskManager.js");
            const task = taskManager.getTask(taskId);
            await task.completeTaskExecution(videoURL);
           return;
        case "image":
            //TODO use spaceModule or convert image to a stream
            await Storage.putFile(Storage.fileTypes.images, objectId, requestBody.uri || requestBody.imageData);
            if (requestBody.buttons) {
                subscriptionManager.notifyClients("", objectId, requestBody.buttons);
            } else {
                subscriptionManager.notifyClients("", objectId);
            }
            return;
        case "audio":
            return await Storage.putFile(Storage.fileTypes.audios, objectId, requestBody.data);
    }
}

async function dataHandler(request, response) {
    try {
        const ref = extractRefFromRequest(request);
        if (!ref) {
            return utils.sendResponse(response, 401, "application/json", {
                message: "Unauthorized request"
            });
        }
        let {timestamp, nonce, signature, objectId} = ref;
        const generatedSignature = generateSignature(timestamp, nonce);
        if (signature === generatedSignature) {
            const requestStatus = request.body.result ? request.body.result.status : request.body.status;
            if (requestStatus === "DONE" || requestStatus === "COMPLETED") {
                await saveResult(ref, request.body);
            }
            return utils.sendResponse(response, 200, "application/json", {});
        } else {
            return utils.sendResponse(response, 401, "application/json", "Unauthorized request");
        }
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "text/plain", "Internal server error");
    }
}

function getWebhookSecret() {
    return secret;
}

module.exports = {
    getWebhookSecret,
    dataHandler,
}
