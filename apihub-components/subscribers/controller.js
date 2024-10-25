const eventPublisher = require("./eventPublisher");
const {sendResponse} = require("../apihub-component-utils/utils");

function registerClient(request, response) {
    eventPublisher.registerClient(request.userId, request, response);
    return sendResponse(response, 200, "application/json", {
        success: true
    });
}

/*function subscribeToObject(request, response) {
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
}*/
function closeClientConnection(request, response) {
    try {
        eventPublisher.closeClientConnection(request.userId, request.sessionId);
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
        eventPublisher.subscribeToObject(userId, request.sessionId, objectId);
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
        eventPublisher.unsubscribeFromObject(userId, request.sessionId, objectId);
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
