import {
    showActionBox,
    showModal,
    reverseQuerySelector
} from "../../../imports.js";

export class announcementsPage {
    constructor(element,invalidate) {
        this.notificationId="space:space-page:announcements"
        webSkel.currentUser.space.observeChange(this.notificationId,invalidate);
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.announcementsContainer = "";
        if(webSkel.currentUser.space.announcements.length>0) {
            webSkel.currentUser.space.announcements.forEach((announcement) => {
                this.announcementsContainer += `<announcement-unit data-title="${announcement.title}" 
                data-content="${announcement.text}" data-date="${announcement.date}" 
                data-id="${announcement.id}" data-local-action="editAction"></announcement-unit>`;
            });
        }else{
            this.announcementsContainer=`<div class="no-data-loaded">No announcements for now</div>`;
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    getAnnouncementId(_target){
        return reverseQuerySelector(_target, "announcement-unit").getAttribute("data-id");
    }
    async showAddAnnouncementModal() {
        await showModal(document.querySelector("body"), "add-announcement-modal", { presenter: "add-announcement-modal"});
    }
    async deleteAction(_target){
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteAnnouncement");
        await webSkel.getService("LlmsService").callFlow(flowId, this.getAnnouncementId(_target));
        this.invalidate();
    }
    async editAction(_target){
        await showModal(document.querySelector("body"), "edit-announcement-modal", { presenter: "edit-announcement-modal", id: this.getAnnouncementId(_target)});
    }
}