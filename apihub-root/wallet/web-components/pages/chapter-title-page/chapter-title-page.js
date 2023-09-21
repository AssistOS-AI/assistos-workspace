import { extractFormInformation, showModal, closeModal, showActionBox } from "../../../imports.js";

export class chapterTitlePage {
    constructor() {
        this.docTitle = "Current Title";
        let url = window.location.hash;
        this.docId = parseInt(url.split('/')[1]);
        this.chapterId = parseInt(url.split('/')[3]);
        this.documentService = webSkel.getService('documentService');
        this._document = this.documentService.getDocument(this.docId);
        if(this._document) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
            this._chapter = this._document.getChapter(this.chapterId);
            if(this._chapter) {
                this.chapterTitle = this._chapter.title;
            } else {
                console.log(`this chapter doesnt exist: chapterId: ${this.chapterId}`);
            }
        } else {
            console.log(`this _document doesnt exist: docId: ${this.docId}`);
        }
        this.updateState = ()=> {
            this._document = this.documentService.getDocument(this.docId);
            if(this._document) {
                this._chapter = this._document.getChapter(this.chapterId);
                if(this._chapter)
                    this.chapterTitle = this._chapter.title;
            }
            this.invalidate();
        }
        // webSkel.space.onChange(this.updateState);
        this._document.observeChange(this.updateState);
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
                await this.documentService.updateDocument(this._document, this.docId);
            }
        }
    }

    openChapterTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.docId}/edit-chapter-title/${this.chapterId}`);
    }

    openChapterBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.docId}/chapter-brainstorming/${this.chapterId}`);
    }

    openViewPage() {
        webSkel.changeToStaticPage(`documents/${this.docId}`);
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