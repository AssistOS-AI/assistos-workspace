import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";

export class addPersonalityModal {
    constructor(element,invalidate) {
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        closeModal(_target);
    }

    async addPersonalitySubmitForm(_target) {
        let formInfo = await extractFormInformation(_target);
        closeModal(_target);
        if(formInfo.isValid) {
            let personalityData={
                    name:formInfo.data.name,
                    description:formInfo.data.description,
                    id:webSkel.servicesRegistry.UtilsService.generateRandomHex(16)
            }
            webSkel.space.addPersonality(personalityData);
            webSkel.space.notifyObservers(webSkel.space.getNotificationId());
        }
    }
}