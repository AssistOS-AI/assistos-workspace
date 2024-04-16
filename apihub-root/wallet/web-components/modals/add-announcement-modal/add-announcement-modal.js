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
            await assistOS.callFlow("AddAnnouncement", {
                title: formInfo.data.title,
                text: formInfo.data.text
            });
            assistOS.space.notifyObservers(assistOS.space.getNotificationId());
            closeModal(_target);
        }
    }
}