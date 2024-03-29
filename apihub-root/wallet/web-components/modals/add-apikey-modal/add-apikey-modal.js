import {
    closeModal,
    extractFormInformation,
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
        let formData = await extractFormInformation(_target);
        if (formData.isValid) {
            const apiKey = formData.data.apiKey
            const keyType=formData.data
            try {
                const keyValidation = await validateOpenAiKey(apiKey);
                if(!keyValidation.success){
                    throw Error(keyValidation.error);
                }
                await system.services.addKeyToSpace(system.space.id,system.user.id,keyType,apiKey);
                closeModal(_target);
                window.location=""
            } catch (error) {
                closeModal(_target);
                showApplicationError('Invalid API Key', `Encountered an error trying to add the API Key to Space: ${system.space.name}`,
                    error);
            }
        }
    }
    closeModal(_target) {
        closeModal(_target);
    }
}