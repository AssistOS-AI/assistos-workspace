import { closeModal, showActionBox, showModal } from "../../../imports.js";

export class announcementsPage {
    constructor(element) {
        this.announcementDivs = "Here are the announcements:";
        this.element = element;
        this.id = webSkel.space.currentDocumentId;
        if(webSkel.space.announcements) {
            this._announcementConfigs = webSkel.space.announcements;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._announcementConfigs = webSkel.space.announcements;
            this.invalidate();
        }
        // webSkel.space.onChange(this.updateState);
    }

    beforeRender() {
        this.announcementDivs = "";
        this._announcementConfigs.forEach((announcement)=> {
            this.announcementDivs += `<announcement-unit data-title="${announcement.title}" data-content="${announcement.text}" data-date="${announcement.date}"></announcement-unit>`;
        });
    }

    async showAddAnnouncementModal() {
        await showModal(document.querySelector("body"), "add-announcement-modal", { presenter: "add-announcement-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}