import {
    closeModal,
    extractFormInformation,
    validateOpenAiKey,
} from "../../../imports.js";

export class AddSpaceModal {
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }

    closeModal(_target) {
        closeModal(_target);
    }

    beforeRender() {
    }

    async addSpace(_target) {
        let formData = await extractFormInformation(_target);
        if (formData.isValid) {

            /* TODO It does not make sense to use an editable flow for default Application operations
            *   Hard to debug, prone to errors, hard to separate the UI logic with data logic (when to refresh, when to close the modal, etc)
            * */
            let flowId = system.space.getFlowIdByName("AddSpace");
            let context = {
                name: formData.data.name,
                apiKey: formData.data.spaceAPIKey
            }
            await system.services.callFlow(flowId, context);


            const apiKey = formData.data.spaceAPIKey
            try {
                const keyValidation = await validateOpenAiKey(apiKey);
                if(!keyValidation.success){
                    throw Error(keyValidation.error);
                }
                let newSpace = await system.factories.createSpace(formData.data.name, apiKey,system.user.id);
                await system.services.addSpaceToUser(system.user.id, newSpace);
                closeModal(_target);
                window.location = "";
            } catch (error) {
                showApplicationError('Failed Creating Space', `Encountered an Issue creating the space ${formData.data.name}`,
                    error);
            }
        }
    }
}