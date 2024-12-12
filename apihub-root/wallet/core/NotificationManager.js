export default class NotificationRouter {
    constructor(notificationRouter) {
        if (!notificationRouter) {
            throw new Error('NotificationRouter instance is required');
        }
        this.notificationRouter = notificationRouter;
    }

    async handleDisconnectEvent(event) {
        let disconnectReason;
        try {
            disconnectReason = event.data ? JSON.parse(event.data) : {message: 'Unknown Reason'};
        } catch (error) {
            console.error('JSON Parse Error:', error);
            disconnectReason = {message:  'Unknown Reason'};
        }

        const disconnectCallback = async () => {
            await assistOS.UI.showModal("client-disconnect-modal", {
                "presenter": "client-disconnect-modal",
                reason: disconnectReason.message
            });
        };

        await this.notificationRouter.handleDisconnectEvent(event, disconnectCallback);
    }

    on(objectId, presenterFN) {
        return this.notificationRouter.on(objectId, presenterFN);
    }
    getEventSource() {
        return this.notificationRouter.getEventSource();
    }
    startGarbageCollector() {
        return this.notificationRouter.startGarbageCollector();
    }

    emit(objectId, data) {
        return this.notificationRouter.emit(objectId, data);
    }

    hasSubscription(objectId) {
        return this.notificationRouter.hasSubscription(objectId);
    }

    createSSEConnection() {
        return this.notificationRouter.createSSEConnection();
    }

    startRefreshInterval() {
        return this.notificationRouter.startRefreshInterval();
    }

    async closeSSEConnection() {
        return this.notificationRouter.closeSSEConnection();
    }

    isDuplicateObject(objectId, data) {
        return this.notificationRouter.isDuplicateObject(objectId, data);
    }

    handleContentEvent(event) {
        return this.notificationRouter.handleContentEvent(event);
    }

    handleErrorEvent(err) {
        return this.notificationRouter.handleErrorEvent(err);
    }

    async unsubscribeFromObject(objectId) {
        return this.notificationRouter.unsubscribeFromObject(objectId);
    }

    getObjectId(prefix, suffix) {
        return this.notificationRouter.getObjectId(prefix, suffix);
    }

    async subscribeToDocument(documentId, suffix, presenterFN) {
        return this.notificationRouter.subscribeToDocument(documentId, suffix, presenterFN);
    }

    async subscribeToSpace(spaceId, suffix, presenterFN) {
        return this.notificationRouter.subscribeToSpace(spaceId, suffix, presenterFN);
    }
}
