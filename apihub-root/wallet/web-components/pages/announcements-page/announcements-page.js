import {
    showActionBox,
    showModal,
    reverseQuerySelector
} from "../../../imports.js";

export class AnnouncementsPage {
    constructor(element,invalidate) {
        system.space.observeChange(system.space.getNotificationId(),invalidate);
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.announcementsContainer = "";
        if(system.space.announcements.length>0) {
            system.space.announcements.forEach((announcement) => {
                this.announcementsContainer += `<announcement-unit data-title="${announcement.title}" 
                data-content="${announcement.text}" data-date="${announcement.date}" 
                data-id="${announcement.id}" data-local-action="editAction"></announcement-unit>`;
            });
        }else{
            this.announcementsContainer=`<div class="no-data-loaded">No announcements for now</div>`;
        }
    }
    afterRender(){
        this.setContext();
    }
    setContext(){
        system.context = {
            "location and available actions": "We are in the Rules and Announcements page in OS. Here you can add announcements.",
            "available items": system.space.announcements.map((announcement)=>announcement.simplify())
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    getAnnouncementId(_target){
        return reverseQuerySelector(_target, "announcement-unit").getAttribute("data-id");
    }
    async showAddAnnouncementModal() {
        await showModal( "add-announcement-modal", { presenter: "add-announcement-modal"});
    }
    async deleteAction(_target){
        let flowId = system.space.getFlowIdByName("DeleteAnnouncement");
        let context = {
            announcementId: this.getAnnouncementId(_target)
        }
        await system.services.callFlow(flowId, context);
        this.invalidate();
    }
    async editAction(_target){
        await showModal("edit-announcement-modal", { presenter: "edit-announcement-modal", id: this.getAnnouncementId(_target)});
    }
}