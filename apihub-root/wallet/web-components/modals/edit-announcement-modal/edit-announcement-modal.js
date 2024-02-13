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
        let announcement = webSkel.currentUser.space.getAnnouncement(this.element.getAttribute("data-id"));
        [this.announcementContent,this.announcementTitle]=[announcement.text,announcement.title];
    }
    closeModal(_target) {
        closeModal(_target);
    }

    async saveAnnouncement(_target) {
        let textContent = reverseQuerySelector(_target,".modal-body").innerText;
        let announcementId = this.element.getAttribute("data-id");
        let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateAnnouncement");
        await webSkel.appServices.callFlow(flowId, announcementId, textContent);
        webSkel.currentUser.space.notifyObservers(webSkel.currentUser.space.getNotificationId());
        closeModal(_target);
    }
}