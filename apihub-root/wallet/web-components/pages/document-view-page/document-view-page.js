import {reverseQuerySelector} from "../../../../WebSkel/utils/dom-utils.js";

export class documentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page", invalidate);
        this._document.observeChange(this._document.getNotificationId() + ":refresh", invalidate);
        this.invalidate = invalidate;
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
    async addChapter() {
        let chapterData= {
            title: "New Chapter",
            id: webSkel.servicesRegistry.UtilsService.generateId(),
            paragraphs: [
                {
                    id:webSkel.servicesRegistry.UtilsService.generateId(),
                    text: "New Paragraph"
                }
            ]
        }
        await this._document.addChapter(chapterData);
        webSkel.space.currentChapterId=chapterData.id;
        this.invalidate();
    }
    async addParagraph(_target){
        let chapter = this._document.getChapter(webSkel.space.currentChapterId);
        let newParagraphId=webSkel.getService("UtilsService").generateId();
        await chapter.addParagraph({id: newParagraphId, text:""},chapter.paragraphs.length);
        webSkel.space.currentParagraphId=newParagraphId;
        this._document.notifyObservers(this._document.getNotificationId()+":document-view-page:"+"chapter:"+`${chapter.id}`);
    }

    afterRender() {
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

    async openChapterBrainstormingPage() {
        await webSkel.changeToDynamicPage("chapter-brainstorming-page",
            `documents/${this._document.id}/chapter-brainstorming-page/${webSkel.space.currentChapterId}`);

    }

    async openManageParagraphsPage() {
        await webSkel.changeToDynamicPage("manage-paragraphs-page",
            `documents/${this._document.id}/manage-paragraphs-page/${webSkel.space.currentChapterId}`);
    }

    async openParagraphProofreadPage() {
        await webSkel.changeToDynamicPage("paragraph-proofread-page",
            `documents/${this._document.id}/paragraph-proofread-page/${webSkel.space.currentChapterId}/${webSkel.space.currentParagraphId}`);
    }

    async openParagraphBrainstormingPage() {
        await webSkel.changeToDynamicPage("paragraph-brainstorming-page",
            `documents/${this._document.id}/paragraph-brainstorming-page/${webSkel.space.currentChapterId}/${webSkel.space.currentParagraphId}`);
    }
    async openDocumentViewPage(){
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }
}