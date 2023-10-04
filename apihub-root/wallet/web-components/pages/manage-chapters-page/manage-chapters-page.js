import { closeModal, showActionBox, showModal } from "../../../imports.js";

export class manageChaptersPage {
    constructor(element, invalidate) {
        this.tab = "Chapters";
        this.id1 = "selected-tab";
        this.id2 = "";
        this.idModal1 = "selected-modal";
        this.idModal2 = "";
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._document.observeChange(this._document.getNotificationId() + ":manage-chapters-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        if(!this._document.getMainIdeas() || this._document.getMainIdeas().length === 0) {
            this.generateMainIdeasButtonName = "Summarize";
        } else {
            this.generateMainIdeasButtonName = "Regenerate";
        }
        this.pageRender(this.tab);
    }

    async openEditTitlePage() {
        await webSkel.changeToDynamicPage("edit-title-page", `documents/${this._document.id}/edit-title-page`);
    }

    async openEditAbstractPage() {
        await webSkel.changeToDynamicPage("edit-abstract-page", `documents/${this._document.id}/edit-abstract-page`);
    }

    async openDocumentSettingsPage() {
        await webSkel.changeToDynamicPage("document-settings-page", `documents/${this._document.id}/document-settings-page`);
    }

    async openManageChaptersPage() {
        await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this._document.id}/manage-chapters-page`);
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async showAddChapterModal() {
        await showModal(document.querySelector("body"), "add-chapter-modal", { presenter: "add-chapter-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    openTab(_target) {
        let selectedTab = document.getElementById("selected-tab");
        this.tab = _target.firstElementChild.nextElementSibling.firstElementChild.innerText;
        this.chaptersDiv = "";
        if(selectedTab !== _target) {
            this.pageRender(this.tab);
            this.invalidate();
        }
    }

    pageRender(tab) {
        switch(tab) {
            case "Chapters":
                this.id1 = "selected-tab";
                this.idModal1 = "selected-modal";
                this.id2 = "";
                this.idModal2 = "";
                this.chaptersDiv = "";
                if(this._document) {
                    let number = 0;
                    this._document.chapters.forEach((item) => {
                        number++;
                        this.chaptersDiv += `<brainstorming-chapter-unit nr="${number}" title="${item.title}"></brainstorming-chapter-unit>`;
                    });
                }
                break;
            case "Possible Ideas":
                this.id1 = "";
                this.idModal1 = "";
                this.id2 = "selected-tab";
                this.idModal2 = "selected-modal";
                this.chaptersDiv = "";
                for(let number = 1; number < 4; number++) {
                    this.chaptersDiv += `<brainstorming-document-idea nr="${number}" title="Idea ${number}"></brainstorming-document-idea>`;
                }
                break;
        }
    }
}