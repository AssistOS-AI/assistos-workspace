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
            let context = {
                title: formInfo.data.title,
                text: formInfo.data.text
            };
            await system.services.callFlow(flowId, context);
            system.space.notifyObservers(system.space.getNotificationId());
            closeModal(_target);
        }
    }
}