import {
    validateOpenAiKey,
} from "../../../imports.js";

export class AddApikeyModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate(async () => {

        });
    }
    beforeRender(){}
    async addKey(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (formData.isValid) {
            const apiKey = formData.data.apiKey
            const keyType=formData.data
            try {
                const keyValidation = await validateOpenAiKey(apiKey);
                if(!keyValidation.success){
                    throw Error(keyValidation.error);
                }
                await assistOS.services.addKeyToSpace(assistOS.space.id,assistOS.user.id,keyType,apiKey);
                closeModal(_target);
                window.location=""
            } catch (error) {
                closeModal(_target);
                showApplicationError('Invalid API Key', `Encountered an error trying to add the API Key to Space: ${assistOS.space.name}`,
                    error);
            }
        }
    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
}