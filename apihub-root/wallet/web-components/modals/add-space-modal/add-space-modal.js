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

            /*
            let flowId = system.space.getFlowIdByName("AddSpace");
             await system.services.callFlow(flowId, context);

             let context = {
                 name: formData.data.name,
                 apiKey: formData.data.spaceAPIKey
             }
             */
            const [spaceName,apiKey]=[formData.data.name,formData.data.spaceAPIKey]

            try {
                const keyValidation = await validateOpenAiKey(apiKey);
                if (!keyValidation.success) {
                    throw Error(keyValidation.error);
                }
                await system.services.createSpace(spaceName,apiKey);
                closeModal(_target);
               await system.loadPage(false,true);
            } catch (error) {
                showApplicationError('Failed Creating Space', `Encountered an Issue creating the space ${formData.data.name}`,
                    error);
            }
        }
    }
}