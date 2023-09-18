import { extractFormInformation, showModal, closeModal, showActionBox } from "../../../imports.js";

export class chapterTitlePage {
    constructor() {
        this.docTitle = "Current Title";
        let url = window.location.hash;
        this.docId =  parseInt(url.split('/')[1]);
        this.chapterId = parseInt(url.split('/')[3]);
        if(webSkel.company.documents) {
            this._documentConfigs = webSkel.company.documents;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.documentService = webSkel.getService('documentService');

        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this._document = this.documentService.getDocument(this.docId);
            if(this._document) {
                this._chapter = this.documentService.getChapter(this._document, this.chapterId);
                if(this._chapter)
                    this.chapterTitle = this._chapter.title;
            }
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);

        this._document = this.documentService.getDocument(this.docId);
        if(this._document) {
            this._chapter = this.documentService.getChapter(this._document, this.chapterId);
            if(this._chapter) {
                this.chapterTitle = this._chapter.title;
            }
        }
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
            const documentIndex = webSkel.company.documents.findIndex(doc => doc.id === this.docId);
            const chapterIndex = webSkel.company.documents[documentIndex].chapters.findIndex(chapter => chapter.id === this.chapterId);
            if (documentIndex !== -1 && chapterIndex !== -1 && formInfo.data.title !== webSkel.company.documents[documentIndex].chapters[chapterIndex].title) {
                webSkel.company.documents[documentIndex].chapters[chapterIndex].title = formInfo.data.title;
                this.documentService.updateDocument(webSkel.company.documents[documentIndex], this.docId);
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

    async showSuggestTitleModal() {
        await showModal(document.querySelector("body"), "suggest-title-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}