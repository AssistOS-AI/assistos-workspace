import {extractFormInformation, showModal, closeModal, showActionBox, DocumentModel} from "../../../imports.js";

export class chapterTitlePage {
    constructor(element, invalidate) {
        this.docTitle = "Current Title";
        let url = window.location.hash;
        this.docId = url.split('/')[1];
        this.chapterId = url.split('/')[3];
        this._document = webSkel.space.getDocument(this.docId);
        this._chapter = this._document.getChapter(this.chapterId);
        this.chapterTitle = this._chapter.title;

        this._document.observeChange(this._chapter.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.title = `<title-edit title="${this.chapterTitle}"></title-edit>`;
        this.alternativeTitles = "";
        if(this._document) {
            let suggestedTitle = "Bees are nature's little pollination superheroes! Let's protect them and ensure our food chain thrives. #SaveTheBees";
            for(let number = 1; number <= 10; number++) {
                this.alternativeTitles += `<alternative-title nr="${number}" title="${suggestedTitle}"></alternative-title>`;
            }
        }
    }

    async saveTitle(_target) {
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            const documentIndex = webSkel.space.documents.findIndex(doc => doc.id === this.docId);
            const chapterIndex = this._document.getChapterIndex(this.chapterId);
            if (documentIndex !== -1 && chapterIndex !== -1 && formInfo.data.title !== this._document.getChapterTitle(this.chapterId)) {
                this._document.updateChapterTitle(this.chapterId, formInfo.data.title);
                await documentFactory.updateDocument(currentSpaceId, this._document);
            }
        }
    }

    async openChapterTitlePage() {
        await webSkel.changeToDynamicPage("chapter-title-page",
            `documents/${this.docId}/chapter-title-page/${this.chapterId}`);

    }

    async openManageParagraphsPage() {
        await webSkel.changeToDynamicPage("manage-paragraphs-page",
            `documents/${this.docId}/manage-paragraphs-page/${this.chapterId}`);
    }


    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this.docId}/document-view-page`, {"document-id": this.docId});
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async showSuggestTitlesModal() {
        await showModal(document.querySelector("body"), "suggest-titles-modal", { presenter: "suggest-titles-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}