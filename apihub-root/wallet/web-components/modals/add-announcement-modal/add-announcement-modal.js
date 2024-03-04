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

            let flowId = webSkel.currentUser.space.getFlowIdByName("AddAnnouncement");
            await webSkel.appServices.callFlow(flowId, formInfo.data.title, formInfo.data.text);
            webSkel.currentUser.space.notifyObservers(webSkel.currentUser.space.getNotificationId());
            closeModal(_target);
        }
    }
}