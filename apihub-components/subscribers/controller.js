const {sendResponse} = require("../apihub-component-utils/utils");
const eventPublisher = require("./eventPublisher");

function registerClient(request, response) {
    eventPublisher.registerClient(request.userId, request, response);
}

function removeClient(request, response) {
    try {
        eventPublisher.removeClient(request.userId);
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
        eventPublisher.subscribeToObject(userId, objectId);
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

function unsubscribeFromObject(request, response) {
    try {
        let objectId = decodeURIComponent(request.params.objectId);
        let userId = request.userId;
        eventPublisher.unsubscribeFromObject(userId, objectId);
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
    subscribeToObject,
    unsubscribeFromObject,
    registerClient,
    removeClient
};