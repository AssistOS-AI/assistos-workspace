import {reverseQuerySelector} from "../../../../WebSkel/utils/dom-utils.js";

export class documentViewPage {
    constructor(element, invalidate) {
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this.element = element;
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page", invalidate);
        this.invalidate = invalidate;
        debugger;
        this.invalidate();
    }

    beforeRender() {
        this.chaptersContainer = "";
        this.title = `<title-view title="${this._document.title}"></title-view>`;
        this.abstractText=this._document.abstract||"No abstract has been set or generated for this document";
        if(this._document.chapters.length > 0) {
            this._document.setCurrentChapter(this._document.chapters[0].id);
            let iterator = 0;
            this._document.chapters.forEach((item) => {
                iterator++;
                this.chaptersContainer += `<chapter-unit data-chapter-number="${iterator}" data-chapter-title="${item.title}" data-chapter-id="${item.id}" data-presenter="chapter-unit"></chapter-unit>`;
            });
        }
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

    async openChapterTitlePage() {
        await webSkel.changeToDynamicPage("chapter-title-page",
            `documents/${this._document.id}/chapter-title-page/${webSkel.space.currentChapterId}`);

    }

    async openManageParagraphsPage() {
        await webSkel.changeToDynamicPage("manage-paragraphs-page",
            `documents/${this._document.id}/manage-paragraphs-page/${webSkel.space.currentChapterId}`);
    }

    async openParagraphProofreadPage() {
        await webSkel.changeToDynamicPage("paragraph-proofread-page",
            `documents/${this._document.id}/paragraph-proofread-page/${webSkel.space.currentChapterId}/${webSkel.space.currentParagraphId}`);
    }

    async openParagraphEditPage() {
        await webSkel.changeToDynamicPage("paragraph-edit-page",
            `documents/${this._document.id}/paragraph-edit-page/${webSkel.space.currentChapterId}/${webSkel.space.currentParagraphId}`);
    }

    async addChapter() {
        let chapterData= {
            title: "New Chapter",
            id: webSkel.servicesRegistry.UtilsService.generateId(),
            paragraphs: [
                {
                    id:webSkel.servicesRegistry.UtilsService.generateId(),
                    text: "Edit your paragraph here"
                }
            ]
        }
        await this._document.addChapter(chapterData);
        this.invalidate();
    }

    async addParagraph(_target){
        let chapter = this._document.getChapter(webSkel.space.currentChapterId);
        await chapter.addParagraph({id: webSkel.getService("UtilsService").generateId(), text:"Edit your paragraph here"});
        this.invalidate();
    }

    afterRender() {
        let chapterSidebar = document.getElementById("chapter-sidebar");
        debugger;
        document.addEventListener("click", (event) => {
            chapterSidebar.style.display = "none";
            let selectedChapter = document.getElementById("select-chapter-visualise");
            if(selectedChapter) {
                document.getElementById("select-chapter-visualise").removeAttribute("id");
            }
        }, true);
    }

}