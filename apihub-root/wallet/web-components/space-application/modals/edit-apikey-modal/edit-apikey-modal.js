const spaceModule = require('assistos').loadModule('space', {});
export class EditApikeyModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.name = this.element.getAttribute('data-name');
        this.key = this.element.getAttribute('data-key');
        this.invalidate();
    }
    beforeRender() {
    }
    afterRender() {
        let nameInput = this.element.querySelector('#name');
        nameInput.value = this.name;
        let keyInput = this.element.querySelector('#secretKey');
        keyInput.value = this.key;
    }

    async saveChanges(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (formData.isValid) {
            const name = formData.data.name;
            const secretKey = formData.data.secretKey.toUpperCase();
            const value = formData.data.value;
            try {
                await spaceModule.editSecret(assistOS.space.id, name, secretKey, value);
                assistOS.UI.closeModal(_target, true);
            } catch (error) {
                assistOS.UI.closeModal(_target);
                await showApplicationError('Invalid API Key', `Encountered an error trying to add the API Key to Space: ${assistOS.space.name}`,
                    error);
            }
        }
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
}