import { closeModal, showActionBox, showModal } from "../../../imports.js";

export class announcementsPage {
    constructor(element) {
        this.announcementDivs = "Here are the announcements:";
        this.element = element;
        this.id = webSkel.company.currentDocumentId;
        if(webSkel.company.documents) {
            this._documentConfigs = (webSkel.company.documents);
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {
        let announcements = [];
        let announcement = {
            title: "Glass Menagerie",
            content: "The father-and-son duo Leopold and Rudolf Blaschka crafted thousands of scientifically accurate models of plants and sea creatures as teaching aids.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eu odio est. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nullam semper, eros vitae facilisis facilisis, diam odio bibendum magna, at volutpat ligula urna ornare neque. Nam pulvinar enim ut tellus."
        };
        for(let i = 0; i < 10; i++) {
            announcements.push(announcement);
        }
        this.announcementDivs = "";
        announcements.forEach((announce)=> {
            this.announcementDivs += `<announcement-unit data-title="${announcement.title}" data-content="${announcement.content}"></announcement-unit>`;
        });
    }

    async showAddAnnouncementModal() {
        await showModal(document.querySelector("body"), "add-announcement-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}