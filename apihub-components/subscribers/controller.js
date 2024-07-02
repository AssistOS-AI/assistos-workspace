const {sendResponse} = require("../apihub-component-utils/utils");
const eventPublisher = (() => {
    let clients = new Map();
    function registerClient(userId, request, response){
        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');
        response.flushHeaders();
        const intervalId = setInterval(() => {
            response.write("event: message\n");
            response.write('data: keep-alive\n\n');
        }, 30000);
        response.on('error', (err) => {
            clearInterval(intervalId);
            console.error('Server SSE error:', err);
            response.end();
        });
        if (clients.has(userId)) {
            const existingClient = clients.get(userId);
            clearInterval(existingClient.intervalId);
            existingClient.res.end();
        }
        let client = {
            res: response,
            userId: userId,
            intervalId: intervalId,
            objectIds: {}
        };
        clients.set(userId, client);
    }
    function notifyClients(userId, objectId, objectData) {
        for(let [key, value] of clients) {
            if(value.objectIds[objectId]) {
                let data = {objectId: objectId};
                if(objectData) {
                    data.data = objectData;
                }
                if(key === userId) {
                    data.isSameUser = true;
                }
                let stringData = JSON.stringify(data);
                value.res.write(`event: content\n`);
                value.res.write(`data: ${stringData}\n\n`);
            }
        }
    }
    function removeClient(userId) {
        let client = clients.get(userId);
        clearInterval(client.intervalId);
        client.res.end();
        clients.delete(userId);
    }
    function subscribeToObject(userId, objectId) {
        let client = clients.get(userId);
        if (!client) {
            return;
        }
        client.objectIds[objectId] = objectId;
    }
    function unsubscribeFromObject(userId, objectId) {
        let client = clients.get(userId);
        if (!client) {
            return;
        }
        delete client.objectIds[objectId];
    }
    return {
        registerClient,
        notifyClients,
        removeClient,
        subscribeToObject,
        unsubscribeFromObject
    }
})();
function registerClient(request, response) {
    eventPublisher.registerClient(request.userId, request, response);
}
function removeClient(request, response) {
    try{
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
    try{
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
    eventPublisher,
    registerClient,
    removeClient
};