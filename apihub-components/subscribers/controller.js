const eventPublisher = require("./eventPublisher");
const {sendResponse} = require("../apihub-component-utils/utils");

function registerClient(request, response) {
    eventPublisher.registerClient(request.userId, request, response);
}

function subscribeToObject(request, response) {
    try {
        const path = request.body.path;
        eventPublisher.subscribeToObject(request.userId, request.sessionId, path);
        return  sendResponse(response, 200, "application/json", {
            success: true
        });
    }catch(error){
        return  sendResponse(response, error.statusCode||500, "application/json", {
            success: false,
            message: e.message
        })
    }
}

function unsubscribeFromObject(request, response) {
    try {
        const path = request.body.path
        eventPublisher.unsubscribeFromObject(request.userId, request.sessionId, path);
        return  sendResponse(response, 200, "application/json", {
            success: true
        });
    }catch(error){
        return  sendResponse(response, error.statusCode||500, "application/json", {
            success: false,
            message: e.message
        })
    }
}

module.exports = {
    registerClient,
    subscribeToObject,
    unsubscribeFromObject,
};
