import {
    validateOpenAiKey,
} from "../../../imports.js";

const userModule = require('assistos').loadModule('user', {});

export class EditApikeyModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.type = this.element.variables["data-type"];
        this.invalidate();
    }

    beforeRender() {
    }

    async SaveChanges(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (formData.isValid) {
            const apiKey = formData.data.apiKey
            try {
                if (this.type === "OpenAI") {
                    const keyValidation = await validateOpenAiKey(apiKey);
                    if (!keyValidation.success) {
                        throw Error(keyValidation.error);
                    }
                }
                await userModule.editAPIKey(this.type, apiKey);
                assistOS.UI.closeModal(_target, true);
                //window.location.reload();
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