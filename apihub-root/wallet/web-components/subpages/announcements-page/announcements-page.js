import { closeModal, showActionBox, showModal } from "../../../imports.js";
import {reverseQuerySelector} from "../../../../WebSkel/utils/dom-utils.js";

export class announcementsPage {
    constructor(element,invalidate) {
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.announcementsContainer = "";
        if(webSkel.space.announcements.length>0) {
            webSkel.space.announcements.forEach((announcement) => {
                this.announcementsContainer += `<announcement-unit data-title="${announcement.title}" data-content="${announcement.text}" data-date="${announcement.date}" data-id="${announcement.id}"></announcement-unit>`;
            });
        }else{
            this.announcementsContainer="No announcements for now";
        }
    }
    async showAddAnnouncementModal() {
        await showModal(document.querySelector("body"), "add-announcement-modal", { presenter: "add-announcement-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getAnnouncementId(_target){
        return reverseQuerySelector(_target, "announcement-unit").getAttribute("data-id");
    }
    async deleteAction(_target){
            await webSkel.space.deleteAnnouncement(this.getAnnouncementId(_target));
            this.invalidate();
    }
    async editAction(_target){

    }
}