import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";
import { Personality } from "../../../imports.js";

export class addPersonalityModal {
    constructor() {
        if(webSkel.space.settings.personalities) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = () => this.invalidate();
        // webSkel.space.onChange(this.updateState);
    }

    beforeRender() {

    }

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