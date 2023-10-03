import {Chapter} from "../../../imports.js";

export class documentViewPage {
    constructor(element, invalidate) {
        this.docTitle = "Documents";
        this.name = "Name";
        this.abstractText = "Edit your abstract";
        let url = window.location.hash;
        this.button = "Add new document";
        this.id = url.split('/')[1];
        this._document = webSkel.space.getDocument(this.id);
        this.docTitle = this._document.title;
        this.chapters = this._document.chapters;
        this.abstractText = this._document.abstract;

        this._document.observeChange(this._document.getNotificationId() + ":document-view-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.chapterDivs = "";
        this.title = `<title-view title="${this.docTitle}"></title-view>`;
        if(this.chapters.length > 0) {
            this._document.setCurrentChapter(this.chapters[0].id);
            let iterator = 0;
            this.chapters.forEach((item) => {
                iterator++;
                this.chapterDivs += `<chapter-unit data-chapter-number="${iterator}" data-chapter-title="${item.title}" data-chapter-id="${item.id}" data-presenter="chapter-unit"></chapter-unit>`;
            });
        }
    }

    async openEditTitlePage() {
        await webSkel.changeToDynamicPage("edit-title-page", `documents/${this.id}/edit-title-page`);
    }

    async openEditAbstractPage() {
        await webSkel.changeToDynamicPage("edit-abstract-page", `documents/${this.id}/edit-abstract-page`);
    }

    async openDocumentSettingsPage() {
        await webSkel.changeToDynamicPage("document-settings-page", `documents/${this.id}/document-settings-page`);
    }

    async openManageChaptersPage() {
        await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this.id}/manage-chapters-page`);
    }

    async openChapterTitlePage() {
        await webSkel.changeToDynamicPage("chapter-title-page",
            `documents/${this.id}/chapter-title-page/${webSkel.space.currentChapterId}`);

    }

    async openManageParagraphsPage() {
        await webSkel.changeToDynamicPage("manage-paragraphs-page",
            `documents/${this.id}/manage-paragraphs-page/${webSkel.space.currentChapterId}`);
    }

    async openParagraphProofreadPage() {
        await webSkel.changeToDynamicPage("paragraph-proofread-page",
            `documents/${this.id}/paragraph-proofread-page/${webSkel.space.currentChapterId}/${webSkel.space.currentParagraphId}`);
    }

    async openParagraphEditPage() {
        await webSkel.changeToDynamicPage("paragraph-edit-page",
            `documents/${this.id}/paragraph-edit-page/${webSkel.space.currentChapterId}/${webSkel.space.currentParagraphId}`);
    }

    async addChapter() {
        const crypto = require("opendsu").loadAPI("crypto");
        this.chapterDivs += `<chapter-unit data-chapter-title="New Chapter" data-chapter-id="${this.chapters.length}" data-presenter="chapter-unit"></chapter-unit>`;

        let chapterObj= {
            title: "New Chapter",
            id: crypto.getRandomSecret(16).toString().split(",").join(""),
            paragraphs: [{id: crypto.getRandomSecret(16).toString().split(",").join(""), text: "Edit your paragraph here"}]
        }

        this._document.addChapter(new Chapter(chapterObj));
        await documentFactory.storeDocument(currentSpaceId, this._document);
        this.invalidate();
    }

    afterRender() {
        let chapterSidebar = document.getElementById("chapter-sidebar");
        if(chapterSidebar) {
            document.addEventListener("click", (event) => {
                chapterSidebar.style.display = "none";
                let selectedChapter = document.getElementById("select-chapter-visualise");
                if(selectedChapter) {
                    document.getElementById("select-chapter-visualise").removeAttribute("id");
                }
            }, true);
        }
    }

}