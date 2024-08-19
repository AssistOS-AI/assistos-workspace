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

function extractRefFromRequest(request) {
    let ref;
    if (request.body.ref) {
        ref = JSON.parse(request.body.ref);
    } else {
        ref = JSON.parse(decodeURIComponent(request.query.ref));
    }
    return ref;
}
async function saveResult(type,spaceId, objectId, userId, requestBody) {
  switch(type){
    case "video":
      await space.APIs.putVideo(spaceId, objectId, requestBody.result.videoUrl);
      break;
    case "image":
        await space.APIs.putImage(spaceId, objectId, requestBody.uri || requestBody.imageData);
        if (requestBody.buttons) {
            eventPublisher.notifyClientTask(userId, objectId, requestBody.buttons);
        } else {
            eventPublisher.notifyClientTask(userId, objectId);
        }
        break;
    case "audio":
      await space.APIs.putAudio(objectId, userId,requestBody.data);
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
        const {timestamp, nonce, signature: receivedSignature, objectId, userId,type} = ref;
        const generatedSignature = generateSignature(timestamp, nonce);
        if (receivedSignature === generatedSignature) {
            const requestStatus=request.body.result?request.body.result.status:request.body.status;
            if (objectId && (requestStatus === "DONE"||requestStatus==="COMPLETED")){
                let spaceId = objectId.split("_")[0];
                const requestBody=
                await saveResult(ref.type,spaceId, objectId, userId, request.body);
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