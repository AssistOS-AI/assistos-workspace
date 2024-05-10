const {sendResponse} = require("../apihub-component-utils/utils");
const EventEmitter = require('events');
const subscribersModule = (()=>{
    let subscribers = {};
    const eventEmitter = new EventEmitter();
    let subscribersResponses = {};
    function getSubscribersRegistry(){
        return subscribers;
    }
    function putSubscriber(spaceId, userId, response, objectId){
        if(!subscribers[spaceId]){
            subscribers[spaceId] = {};
        }
        subscribers[spaceId][userId] = objectId;
    }
    function putResponse(spaceId, userId, response){
        if(!subscribersResponses[spaceId]){
            subscribersResponses[spaceId] = {};
        }
        subscribersResponses[spaceId][userId] = response;
    }
    function removeSubscriber(spaceId, userId){
        delete subscribers[spaceId][userId];
        delete subscribersResponses[spaceId][userId];
    }
    function notifySubscribers(spaceId, containerObjectId, targetObjectType, targetObjectId){
        if(!subscribers[spaceId]) return;
        for (let userId in subscribers[spaceId]){
            if (subscribers[spaceId][userId] === containerObjectId && subscribersResponses[spaceId][userId] && !subscribersResponses[spaceId][userId].sent){
                let response = subscribersResponses[spaceId][userId];
                response.sent = true;
                eventEmitter.emit(`${spaceId}/${userId}`);
                sendResponse(response, 200, "application/json", {
                    success: true,
                    data: {
                        targetObjectType: targetObjectType,
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
        notifySubscribers,
        eventEmitter
    }
})();

module.exports = subscribersModule;