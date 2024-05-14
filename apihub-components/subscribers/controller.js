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
            if(!subscriberResponse){
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
})
();

async function getLatestUpdates(request, response) {
    const spaceId = request.params.spaceId;
    let userId = request.userId;

    let timeoutId = setTimeout(() => {
        if (!response.sent) {
            sendResponse(response, 200, "application/json", {
                success: true,
                data: null
            })
        }
    }, 30000);
    subscribersModule.putResponse(spaceId, userId, response, timeoutId);
}

function subscribeToObject(request, response) {
    const spaceId = request.params.spaceId;
    let userId = request.userId;
    let objectId = request.params.objectId;
    subscribersModule.putSubscriber(spaceId, userId, objectId);
    sendResponse(response, 200, "application/json", {
        success: true
    })
}

function unsubscribeFromObject(request, response) {
    const spaceId = request.params.spaceId;
    let userId = request.userId;
    let objectId = request.params.objectId;
    subscribersModule.removeObjectSubscription(spaceId, userId, objectId);
    sendResponse(response, 200, "application/json", {
        success: true
    })
}

module.exports = {
    subscribersModule,
    getLatestUpdates,
    subscribeToObject,
    unsubscribeFromObject
};