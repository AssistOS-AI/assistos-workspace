import {
    validateOpenAiKey,
} from "../../../imports.js";

const userModule = require('assistos').loadModule('user', {});

export class AddApikeyModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate(async () => {

        });
    }

    beforeRender() {
        this.APIKeyTypeOptions = "";
        Object.keys(assistOS.space.apiKeys).forEach((keyType) => {
            this.APIKeyTypeOptions += `<option value="${keyType}">${keyType}</option>`
        })
    }

    async addAPIKey(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (formData.isValid) {
            const apiKey = formData.data.apiKey
            const keyType = formData.data.keyType
            try {
                if (keyType === "OpenAI") {
                    const keyValidation = await validateOpenAiKey(apiKey);
                    if (!keyValidation.success) {
                        throw Error(keyValidation.error);
                    }
                }
                await userModule.loadAPIs().addAPIKey(keyType, apiKey);
                assistOS.UI.closeModal(_target);
                window.location = ""
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