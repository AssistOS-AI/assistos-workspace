import { closeModal, showActionBox } from "../../../imports.js";

export class chapterBrainstormingPage {
    constructor() {
        let url = window.location.hash;
        this.docId =  parseInt(url.split('/')[1]);
        this.chapterId = parseInt(url.split('/')[3]);
        this.docTitle = "Titlu document";
        if(webSkel.company.documents) {
            this._documentConfigs = (webSkel.company.documents);
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this._document = this.documentService.getDocument(this.docId);
            if(this._document) {
                this._chapter = this.documentService.getChapter(this._document, this.chapterId);
                if(this._chapter) {
                    this.chapterTitle = this._chapter.title;
                }
            }
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);

        this.documentService = webSkel.initialiseService('documentService');
        this._document = this.documentService.getDocument(this.docId);
        if(this._document) {
            this._chapter = this.documentService.getChapter(this._document, this.chapterId);
            if(this._chapter) {
                this.chapterTitle = this._chapter.title;
            }
        }
    }

    beforeRender() {
        if(!this._document.mainIdeas || this._document.mainIdeas.length === 0) {
            this.generateMainIdeasButtonName = "Summarize";
        } else {
            this.generateMainIdeasButtonName = "Regenerate";
        }
        let suggestedTitle = "Bees are nature's little pollination superheroes! Let's protect them and ensure our food chain thrives. #SaveTheBees";
        this.alternativeAbstracts = "";
        this.title = `<title-view title="${this.chapterTitle}"></title-view>`;
        if(this._document) {
            for(let number = 1; number <= 10; number++) {
                this.alternativeAbstracts += `<alternative-abstract-renderer nr="${number}" title="${suggestedTitle}"></alternative-abstract-renderer>`;
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

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}