const subscriptionManager = require("./SubscriptionManager");
const {sendResponse} = require("../apihub-component-utils/utils");

function registerClient(request, response) {
    subscriptionManager.registerClient(request.userId, request, response);
    return sendResponse(response, 200, "application/json", {
        success: true
    });
}
function closeClientConnection(request, response) {
    try {
        subscriptionManager.closeClientConnection(request.userId, request.sessionId);
        sendResponse(response, 200, "application/json", {
            success: true
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: e.message
        })
    }
}

function subscribeToObject(request, response) {
    try {
        let objectId = decodeURIComponent(request.params.objectId);
        let userId = request.userId;
        subscriptionManager.subscribeToObject(userId, request.sessionId, objectId);
        return sendResponse(response, 200, "application/json", {
            success: true
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: e.message
        })
    }
}

function unsubscribeFromObject(request, response) {
    try {
        let objectId = decodeURIComponent(request.params.objectId);
        let userId = request.userId;
        subscriptionManager.unsubscribeFromObject(userId, request.sessionId, objectId);
        sendResponse(response, 200, "application/json", {
            success: true
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: e.message
        });
    }
}
module.exports = {
    registerClient,
    subscribeToObject,
    unsubscribeFromObject,
    closeClientConnection
};
