const spaceModule = require('assistos').loadModule('space', {});
const userModule = require('assistos').loadModule('user', {});

export class AdvancedSettings {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
    }
    async deleteSpace() {
        let message = `Are you sure you want to delete the space: ${assistOS.space.name}?`;
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (confirmation) {
            let currentSpaceId;
            let message = await assistOS.loadifyComponent(this.element, async () => {
                let message = await spaceModule.deleteSpace(assistOS.space.id);
                currentSpaceId = await userModule.getCurrentSpaceId(assistOS.user.email);
                return message;
            });
            if (message) {
                await showApplicationError("Error deleting space", message, "");
            } else {
                window.location.href = window.location.href.split("#")[0] + `#${currentSpaceId}`;
                window.location.reload();
            }
        }
    }
}