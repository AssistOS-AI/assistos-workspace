const utilModule = require('assitos').loadModule('util', {});

class NotificationRouter{
    constructor() {
        this.objectsToRefresh = [];
        this.listeners = {};
        this.refreshDelay = 2000;
    }
    on(objectId, presenter) {
        if (!this.listeners[objectId]) {
            this.listeners[objectId] = [];
        }
        this.listeners[objectId].push(new WeakRef(presenter));
    }

    emit(objectId, data) {
        const eventListeners = this.listeners[objectId] || [];
        this.listeners[objectId] = eventListeners.filter(weakRef => {
            const presenter = weakRef.deref();
            if (presenter) {
                presenter.onUpdate(data);
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
        this.intervalId = setInterval(this.startRefreshInterval, this.refreshDelay);
        this.eventSource.addEventListener('content', this.handleContentEvent.bind(this));
        this.eventSource.addEventListener('disconnect', this.handleDisconnectEvent.bind(this));
        this.eventSource.addEventListener('error', this.handleErrorEvent.bind(this));
        console.log("SSE Connection created");
    }
    startRefreshInterval(){
        let parents = new Set();

        for (let object of this.objectsToRefresh) {
            const objectIdParts = object.objectId.split('/');
            if(objectIdParts.length > 1){
                let parentId = objectIdParts[0];
                //TODO here
                if (!parents.has(parentId)) {
                    parents.set(parentId, object.data);
                }
            } else {
                parents.set(object.objectId, object.data);
            }
        }
        for (let parent of parents) {
            this.emit(parent, parents.get(parent));
        }

        this.objectsToRefresh = [];
    }
    async closeSSEConnection() {
        clearInterval(this.intervalId);
        await utilModule.request("/events/close", "GET");
    }

    handleContentEvent(event) {
        console.log("Notification received");
        let parsedMessage = JSON.parse(event.data);
        this.objectsToRefresh.push({objectId: parsedMessage.objectId, data: parsedMessage.data});
    }
    async handleDisconnectEvent(event) {
        let disconnectReason = JSON.parse(event.data);
        clearInterval(this.intervalId);
        this.eventSource.close();
        await assistOS.UI.showModal("client-disconnect-modal", {
            "presenter": "client-disconnect-modal",
            reason: disconnectReason.message
        });
    }
    handleErrorEvent(err) {
        this.eventSource.close();
        clearInterval(this.intervalId);
        console.error('EventSource failed:', err);
    }

    async unsubscribeFromObject(objectId) {
        await utilModule.request(`/events/unsubscribe/${objectId}`, "GET");
    }
    getObjectId(prefix, suffix) {
        return `${prefix}/${suffix}`;
    }
    async subscribeToDocument(documentId, suffix, presenter) {
        this.on(this.getObjectId(documentId, suffix), presenter);
        if(this.hasSubscription(documentId)){
            return;
        }
        await utilModule.request(`/events/subscribe/${documentId}`, "GET");
    }
    async subscribeToSpace(spaceId, suffix, presenter) {
        this.on(this.getObjectId(spaceId, suffix), presenter);
        if(this.hasSubscription(spaceId)){
            return;
        }
        await utilModule.request(`/events/subscribe/${spaceId}`, "GET");
    }
}
const NotificationRouterInstance = new NotificationRouter();
export default NotificationRouterInstance;
