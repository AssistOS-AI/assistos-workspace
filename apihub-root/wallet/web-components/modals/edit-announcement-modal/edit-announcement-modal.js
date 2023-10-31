import {
    closeModal,
    reverseQuerySelector
} from "../../../imports.js";


export class editAnnouncementModal {
    constructor(element,invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
        let announcement = webSkel.space.getAnnouncement(this.element.getAttribute("data-id"));
        [this.announcementContent,this.announcementTitle]=[announcement.text,announcement.title];
    }
    closeModal(_target) {
        closeModal(_target);
    }

    async saveAnnouncement(_target) {
        let textContent = reverseQuerySelector(_target,".modal-body").innerText;
        let announcementId = this.element.getAttribute("data-id");
        await webSkel.space.updateAnnouncement(announcementId, textContent);
        webSkel.space.notifyObservers(webSkel.space.getNotificationId());
        closeModal(_target);
    }
}