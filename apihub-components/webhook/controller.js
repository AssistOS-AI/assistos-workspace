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
        const {timestamp, nonce, signature: receivedSignature, saveDataConfig, __securityContext} = ref;
        const generatedSignature = generateSignature(timestamp, nonce);
        if (receivedSignature === generatedSignature) {
            if(saveDataConfig){
                let requestDummy = {
                    headers:{
                        cookie: __securityContext.cookies
                    }
                }
                const SecurityContext = require("assistos").ServerSideSecurityContext;
                let securityContext = new SecurityContext(requestDummy);
                const module = require("assistos").loadModule(saveDataConfig.module, securityContext);
                await module[saveDataConfig.fnName](...saveDataConfig.params, request.body);
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