const {generateId} = require("../apihub-component-utils/crypto");
const crypto = require('crypto');
const utils = require("../apihub-component-utils/utils");
const secret = generateId(32);
const space = require("../spaces-storage/space.js");
const eventPublisher = require("../subscribers/eventPublisher.js");
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
    const spaceId = objectId.split("_")[0];

    switch (ref.type) {
        case "video":
            const taskId = ref.taskId;
            const videoURL = requestBody.result.videoUrl;
            const taskManager = require("../tasks/TaskManager.js");
            const task = taskManager.getTask(taskId);
            await task.completeTaskExecution(videoURL);
            eventPublisher.notifyClientTask(userId, spaceId+"_"+objectId);
           return;
        case "image":
            //TODO use spaceModule or convert image to a stream
            await Storage.putFile(Storage.fileTypes.images, objectId, requestBody.uri || requestBody.imageData);
            if (requestBody.buttons) {
                eventPublisher.notifyClientTask(userId, objectId, requestBody.buttons);
            } else {
                eventPublisher.notifyClientTask(userId, objectId);
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
                success: false,
                message: "Unauthorized request"
            });
        }
        let {timestamp, nonce, signature, objectId} = ref;
        const generatedSignature = generateSignature(timestamp, nonce);
        if (signature === generatedSignature) {
            const requestStatus = request.body.result ? request.body.result.status : request.body.status;
            if (objectId && (requestStatus === "DONE" || requestStatus === "COMPLETED")) {
                await saveResult(ref, request.body);
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
