import {
    validateOpenAiKey,
} from "../../../../imports.js";

export class AddSpaceModal {
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    beforeRender() {
    }

    async addSpace(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (formData.isValid) {

            /* TODO It does not make sense to use an editable flow for default Application operations
            *   Hard to debug, prone to errors, hard to separate the UI logic with data logic (when to refresh, when to close the modal, etc)
            * */

            /*
             await assistOS.callFlow("AddSpace", {
                 name: formData.data.name,
                 apiKey: formData.data.spaceAPIKey
             });
             */
            const [spaceName,apiKey]=[formData.data.name,formData.data.spaceAPIKey]

            try {
                await assistOS.createSpace(spaceName,apiKey);
                assistOS.UI.closeModal(_target);

            } catch (error) {
                showApplicationError('Failed Creating Space', `Encountered an Issue creating the space ${formData.data.name}`,
                    assistOS.UI.sanitize(error.message));
            }
        }
    }
}