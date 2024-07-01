const {sendResponse} = require("../apihub-component-utils/utils");
const subscribersModule = (() => {
    let subscribers = {};
    let subscribersResponses = {};

    function getSubscribersRegistry() {
        return subscribers;
    }

    function putSubscriber(spaceId, userId, objectId) {
        if (!subscribers[spaceId]) {
            subscribers[spaceId] = {};
        }
        if (!subscribers[spaceId][userId]) {
            subscribers[spaceId][userId] = {};
        }
        subscribers[spaceId][userId][objectId] = objectId;
    }

    function putResponse(spaceId, userId, response, timeoutId) {
        if (!subscribersResponses[spaceId]) {
            subscribersResponses[spaceId] = {};
        }
        subscribersResponses[spaceId][userId] = {
            response: response,
            timeoutId: timeoutId
        };
    }

    function removeSubscriber(spaceId, userId) {
        delete subscribers[spaceId][userId];
        delete subscribersResponses[spaceId][userId];
    }

    function removeObjectSubscription(spaceId, userId, objectId) {
        delete subscribers[spaceId][userId][objectId];
        if (subscribers[spaceId][userId] === {}) {
            delete subscribers[spaceId][userId];
        }
        if (subscribers[spaceId] === {}) {
            delete subscribers[spaceId];
        }
    }

    function notifySubscribers(spaceId, sourceUserId, objectId, targetObjectId) {
        if (!subscribers[spaceId]) return;
        for (let userId of Object.keys(subscribers[spaceId])) {
            if (!subscribers[spaceId][userId][objectId]) {
                continue;
            }

            let subscriberResponse = subscribersResponses[spaceId][userId];
            if (!subscriberResponse) {
                continue;
            }
            if (!subscriberResponse.response) {
                continue;
            }
            if (!subscriberResponse.response.sent) {
                subscriberResponse.response.sent = true;
                clearTimeout(subscribersResponses[spaceId][userId].timeoutId);
                let isSameUser = false;
                if (userId === sourceUserId) {
                    isSameUser = true;
                }
                sendResponse(subscriberResponse.response, 200, "application/json", {
                    success: true,
                    data: {
                        isSameUser: isSameUser,
                        targetObjectId: targetObjectId
                    }
                });
                delete subscribersResponses[spaceId][userId];
            }
        }
    }


    return {
        getSubscribersRegistry,
        putSubscriber,
        putResponse,
        removeSubscriber,
        removeObjectSubscription,
        notifySubscribers,
    }
})();

// async function getLatestUpdates(request, response) {
//     const spaceId = request.params.spaceId;
//     let userId = request.userId;
//
//     let timeoutId = setTimeout(() => {
//         if (!response.sent) {
//             sendResponse(response, 200, "application/json", {
//                 success: true,
//                 data: null
//             })
//         }
//     }, 30000);
//     subscribersModule.putResponse(spaceId, userId, response, timeoutId);
// }
//
// function subscribeToObject(request, response) {
//     const spaceId = request.params.spaceId;
//     let userId = request.userId;
//     let objectId = request.params.objectId;
//     subscribersModule.putSubscriber(spaceId, userId, objectId);
//     sendResponse(response, 200, "application/json", {
//         success: true
//     })
// }
//
// function unsubscribeFromObject(request, response) {
//     const spaceId = request.params.spaceId;
//     let userId = request.userId;
//     let objectId = request.params.objectId;
//     subscribersModule.removeObjectSubscription(spaceId, userId, objectId);
//     sendResponse(response, 200, "application/json", {
//         success: true
//     })
// }

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
    function notifyClient(userId, eventType, objectId, objectData) {
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
                value.res.write(`event: ${eventType}\n`);
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
        notifyClient,
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
    subscribersModule,
    //getLatestUpdates,
    subscribeToObject,
    unsubscribeFromObject,
    eventPublisher,
    registerClient,
    removeClient
};