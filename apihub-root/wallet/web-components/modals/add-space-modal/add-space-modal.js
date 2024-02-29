import {
    closeModal,
    extractFormInformation,
    validateOpenAiKey,
    SpaceFactory
} from "../../../imports.js";

export class addSpaceModal {
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
            //let flowId = webSkel.currentUser.space.getFlowIdByName("AddSpace");
            //await webSkel.appServices.callFlow(flowId, formData.data.name,formData.data.spaceAPIKey);


            const apiKey = formData.data.spaceAPIKey
            try {
                const keyValidation = await validateOpenAiKey(apiKey);
                if(!keyValidation.success){
                    throw Error(keyValidation.error);
                }
                let newSpace = await SpaceFactory.createSpace(formData.data.name, apiKey);
                await webSkel.appServices.addSpaceToUser(webSkel.currentUser.id, newSpace);
                closeModal(_target);
                window.location = "";
            } catch (error) {
                showApplicationError('Failed Creating Space', `Encountered an Issue creating the space ${formData.data.name}`,
                    error);
            }
        }
    }
}