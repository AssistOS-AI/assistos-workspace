import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";

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
            };
            await webSkel.getService("GlobalFlowsService").spaceFlows.addAnnouncement(announcementData);
            webSkel.currentUser.space.notifyObservers(webSkel.currentUser.space.getNotificationId());
            closeModal(_target);
        }
    }
}