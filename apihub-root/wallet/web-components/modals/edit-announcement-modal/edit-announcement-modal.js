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

    }
    closeModal(_target) {
        closeModal(_target);
    }
    afterRender(){
        let title = this.element.querySelector("#title");
        let content = this.element.querySelector("#content");
        let announcement = webSkel.currentUser.space.getAnnouncement(this.element.getAttribute("data-id"));
        title.value = announcement.title;
        content.value = announcement.text;
    }

    async saveAnnouncement(_target) {
        let formData = await webSkel.extractFormInformation(_target);
        let announcementId = this.element.getAttribute("data-id");
        let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateAnnouncement");
        await webSkel.appServices.callFlow(flowId, announcementId, formData.data.title, formData.data.content);
        webSkel.currentUser.space.notifyObservers(webSkel.currentUser.space.getNotificationId());
        closeModal(_target);
    }
}