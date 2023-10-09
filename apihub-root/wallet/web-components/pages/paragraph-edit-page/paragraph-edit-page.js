import { closeModal, DocumentModel, showActionBox } from "../../../imports.js";

export class paragraphEditPage {
    constructor(element, invalidate) {
        let url = window.location.hash;
        this.docId =  url.split('/')[1];
        this.chapterId = url.split('/')[3];
        this.paragraphId = url.split('/')[4];
        this._document = webSkel.space.getDocument(this.docId);
        this._chapter = this._document.getChapter(this.chapterId);
        this._paragraph = this._document.getParagraph(this.chapterId, this.paragraphId);
        this.paragraphDiv = this._paragraph;

        this._document.observeChange(this._paragraph.getNotificationId(this.chapterId), invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        if(!this._document.getMainIdeas() || this._document.getMainIdeas().length === 0) {
            this.generateMainIdeasButtonName = "Summarize";
        } else {
            this.generateMainIdeasButtonName = "Regenerate";
        }
        let suggestedTitle = "Bees are nature's little pollination superheroes! Let's protect them and ensure our food chain thrives. #SaveTheBees";
        this.alternativeAbstracts = "";
        this.title = `<title-view title="${this.chapterTitle}"></title-view>`;
        if(this._document) {
            for(let number = 1; number <= 10; number++) {
                this.alternativeAbstracts += `<alternative-abstract nr="${number}" title="${suggestedTitle}"></alternative-abstract>`;
            }
        }
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this.docId}/document-view-page`);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async openParagraphProofreadPage() {
        await webSkel.changeToDynamicPage("paragraph-proofread-page",
            `documents/${this.docId}/paragraph-proofread-page/${this.chapterId}/${this.paragraphId}`);
    }

    async openParagraphEditPage() {
        await webSkel.changeToDynamicPage("paragraph-edit-page",
            `documents/${this.docId}/paragraph-edit-page/${this.chapterId}/${this.paragraphId}`);
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}