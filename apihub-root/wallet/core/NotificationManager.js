const NotificationRouter = require('assistos').loadModule('notification', {}).NotificationRouter;

export default class NotificationManager extends NotificationRouter {
    constructor() {
        super();
    }

    async handleDisconnectEvent(event) {
        const disconnectCallback = async (disconnectReason) => {
            await assistOS.UI.showModal("client-disconnect-modal", {
                presenter: "client-disconnect-modal",
                reason: disconnectReason.message
            });
        };
        await super.handleDisconnectEvent(event, disconnectCallback);
    }
}
