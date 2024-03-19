import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";

export class AddAnnouncementModal {
    constructor(element,invalidate) {
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        closeModal(_target);
    }

    async addAnnouncementSubmitForm(_target) {
        let formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {

            let flowId = system.space.getFlowIdByName("AddAnnouncement");
            await system.services.callFlow(flowId, formInfo.data.title, formInfo.data.text);
            system.space.notifyObservers(system.space.getNotificationId());
            closeModal(_target);
        }
    }
}