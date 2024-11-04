const utilModule = require('assistos').loadModule('util', {});

class NotificationRouter{
    constructor() {
        this.objectsToRefresh = [];
        this.listeners = {};
        this.refreshDelay = 2000;
        this.startGarbageCollector();
    }
    on(objectId, presenterFN) {
        if (!this.listeners[objectId]) {
            this.listeners[objectId] = [];
        }
        this.listeners[objectId].push(new WeakRef(presenterFN));
    }

    startGarbageCollector() {
        this.garbageInterval = setInterval(async () => {
            for (const objectId in this.listeners) {
                const weakRefs = this.listeners[objectId];
                const stillReferenced = weakRefs.filter(weakRef => weakRef.deref());

                // If there are no active references, unsubscribe from the server
                if (stillReferenced.length === 0) {
                    await this.unsubscribeFromObject(objectId);
                    delete this.listeners[objectId];
                }
            }
        }, 60000 * 5); // 5 minutes
    }

    emit(objectId, data) {
        if(!this.listeners[objectId]){
            // no one is subscribed to this object
            return;
        }
        const eventListeners = this.listeners[objectId];
        this.listeners[objectId] = eventListeners.filter(weakRef => {
            const presenterFN = weakRef.deref();
            if (presenterFN) {
                presenterFN(data);
                return true;
            }
            return false;
        });
    }
    hasSubscription(objectId){
        return this.listeners[objectId] && this.listeners[objectId].length > 0;
    }

    createSSEConnection() {
        if(this.eventSource){
            return;
        }
        this.eventSource = new EventSource("/events", {withCredentials: true});
        this.intervalId = setInterval(this.startRefreshInterval.bind(this), this.refreshDelay);
        this.eventSource.addEventListener('content', this.handleContentEvent.bind(this));
        this.eventSource.addEventListener('disconnect', this.handleDisconnectEvent.bind(this));
        this.eventSource.addEventListener('error', this.handleErrorEvent.bind(this));
        console.log("SSE Connection created");
    }
    startRefreshInterval(){
        for (let object of this.objectsToRefresh) {
            this.emit(object.objectId, object.data);
        }

        this.objectsToRefresh = [];
    }
    async closeSSEConnection() {
        clearInterval(this.intervalId);
        clearInterval(this.garbageInterval)
        await utilModule.request("/events/close", "GET");
    }
    isDuplicateObject(objectId, data){
        let foundObj = this.objectsToRefresh.find(obj => obj.objectId === objectId);
        if(foundObj){
            if(typeof data === "object" && typeof foundObj.data === "object"){
                return JSON.stringify(foundObj.data) === JSON.stringify(data);
            }
            return foundObj.data === data;
        }
        return false;
    }
    handleContentEvent(event) {
        console.log("Notification received");
        let parsedMessage = JSON.parse(event.data);
        // if(this.isDuplicateObject(parsedMessage.objectId, parsedMessage.data)){
        //     return;
        // }
        this.objectsToRefresh.push({objectId: parsedMessage.objectId, data: parsedMessage.data});
    }
    async handleDisconnectEvent(event) {
        let disconnectReason = JSON.parse(event.data);
        clearInterval(this.intervalId);
        clearInterval(this.garbageInterval);
        this.eventSource.close();
        await assistOS.UI.showModal("client-disconnect-modal", {
            "presenter": "client-disconnect-modal",
            reason: disconnectReason.message
        });
    }
    handleErrorEvent(err) {
        this.eventSource.close();
        clearInterval(this.intervalId);
        clearInterval(this.garbageInterval);
        console.error('EventSource failed:', err);
    }

    async unsubscribeFromObject(objectId) {
        let encodedObjectId = encodeURIComponent(objectId);
        await utilModule.request(`/events/unsubscribe/${encodedObjectId}`, "GET");
    }

    getObjectId(prefix, suffix) {
        return `${prefix}/${suffix}`;
    }
    async subscribeToDocument(documentId, suffix, presenterFN) {
        this.on(this.getObjectId(documentId, suffix), presenterFN);
        if(this.hasSubscription(documentId)){
            return;
        }
        let encodedObjectId = encodeURIComponent(documentId);
        await utilModule.request(`/events/subscribe/${encodedObjectId}`, "GET");
    }
    async subscribeToSpace(spaceId, suffix, presenterFN) {
        this.on(this.getObjectId(spaceId, suffix), presenterFN);
        if(this.hasSubscription(spaceId)){
            return;
        }
        let encodedObjectId = encodeURIComponent(spaceId);
        await utilModule.request(`/events/subscribe/${encodedObjectId}`, "GET");
    }
}
export default new NotificationRouter();
