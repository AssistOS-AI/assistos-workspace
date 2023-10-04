import { closeModal, showActionBox } from "../../../imports.js";

export class manageParagraphsPage {
    constructor(element, invalidate) {
        let url = window.location.hash;
        this.docId =  url.split('/')[1];
        this.chapterId = url.split('/')[3];
        this.docTitle = "Titlu document";
        this._document = webSkel.space.getDocument(this.docId);
        this._chapter = this._document.getChapter(this.chapterId);
        this.chapterTitle = this._chapter.title;

        this._document.observeChange(this._document.getNotificationId()+ ":manage-chapters-page", invalidate);
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

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}