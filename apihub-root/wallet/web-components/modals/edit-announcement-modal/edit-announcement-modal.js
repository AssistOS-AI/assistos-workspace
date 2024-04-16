import {
    closeModal,
} from "../../../imports.js";


export class EditAnnouncementModal {
    constructor(element,invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {

    }
    closeModal(_target) {
        closeModal(_target);
    }
    afterRender(){
        let title = this.element.querySelector("#title");
        let content = this.element.querySelector("#content");
        let announcement = assistOS.space.getAnnouncement(this.element.getAttribute("data-id"));
        title.value = announcement.title;
        content.value = announcement.text;
    }

    async saveAnnouncement(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        let announcementId = this.element.getAttribute("data-id");
        await assistOS.callFlow("UpdateAnnouncement", {
            announcementId: announcementId,
            title: formData.data.title,
            text: formData.data.content
        });
        assistOS.space.notifyObservers(assistOS.space.getNotificationId());
        closeModal(_target);
    }
}