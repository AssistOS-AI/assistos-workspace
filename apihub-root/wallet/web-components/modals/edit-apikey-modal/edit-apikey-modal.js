import {
    validateOpenAiKey,
} from "../../../imports.js";

const userModule = require('assistos').loadModule('user', {});

export class EditApikeyModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.type = this.element.variables["data-type"];
        this.hasUserId = this.element.variables["data-has-user-id"];
        this.invalidate();
    }
    stringToBool(str) {
        return str.toLowerCase() === 'true';
    }
    beforeRender() {
        if(this.stringToBool(this.hasUserId)){
            this.userIdInput = `<div class="form-item">
                <label class="form-label" for="userId">User ID</label>
                <input type="text" class="form-input" name="userId" data-id="userId" id="userId" style="-webkit-text-security: disc;" required>
        </div>`
        }
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
                let APIKeyObj = {
                    type: this.type,
                    APIKey: apiKey
                }
                if(formData.data.userId){
                    APIKeyObj.userId = formData.data.userId;
                }
                await userModule.editAPIKey(APIKeyObj);
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