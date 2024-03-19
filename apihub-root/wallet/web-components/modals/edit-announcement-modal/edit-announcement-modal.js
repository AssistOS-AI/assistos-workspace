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
        let announcement = system.space.getAnnouncement(this.element.getAttribute("data-id"));
        title.value = announcement.title;
        content.value = announcement.text;
    }

    async saveAnnouncement(_target) {
        let formData = await system.UI.extractFormInformation(_target);
        let announcementId = this.element.getAttribute("data-id");
        let flowId = system.space.getFlowIdByName("UpdateAnnouncement");
        await system.services.callFlow(flowId, announcementId, formData.data.title, formData.data.content);
        system.space.notifyObservers(system.space.getNotificationId());
        closeModal(_target);
    }
}