const spaceModule = assistOS.loadModule('space', {});
export class AddKeyModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {

    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
    async addSecret(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (formData.isValid) {
            let secretKey = formData.data.secretKey.toUpperCase()
            try {
                await spaceModule.addSecret(assistOS.space.id, formData.data.name, secretKey, formData.data.value);
                assistOS.UI.closeModal(_target, true);
            } catch (e) {
                let jsonMessage = JSON.parse(e.message);
                assistOS.showToast(jsonMessage.message, "error", 5000);
            }

        }
    }
}