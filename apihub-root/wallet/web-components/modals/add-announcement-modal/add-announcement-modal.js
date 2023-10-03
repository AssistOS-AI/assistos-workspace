import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";

export class addAnnouncementModal {
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
            let announcementData={
                title:formInfo.data.title,
                text:formInfo.data.text,
                date: new Date().toISOString().split('T')[0],
                id:webSkel.servicesRegistry.UtilsService.generateRandomHex(16)
            };
            await webSkel.space.addAnnouncement(announcementData);
            webSkel.space.notifyObservers(webSkel.space.getNotificationId());
            closeModal(_target);
        }
    }
}