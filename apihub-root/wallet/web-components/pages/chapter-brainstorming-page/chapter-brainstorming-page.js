import { closeModal, showActionBox } from "../../../imports.js";

export class chapterBrainstormingPage {
    constructor() {
        let url = window.location.hash;
        this.docId =  parseInt(url.split('/')[1]);
        this.chapterId = parseInt(url.split('/')[3]);
        this.docTitle = "Titlu document";
        this.documentService = webSkel.getService('documentService');
        this._document = this.documentService.getDocument(this.docId);
        if(this._document) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
            this._chapter = this._document.getChapter(this.chapterId);
            if(this._chapter) {
                this.chapterTitle = this._chapter.title;
            }
            else {
                console.log(`this chapter doesnt exist: chapterId: ${this.chapterId}`);
            }
        }
        else {
            console.log(`this _document doesnt exist: docId: ${this.docId}`);
        }
        this.updateState = ()=> {
            this._document = this.documentService.getDocument(this.docId);
            if(this._document) {
                this._chapter = this._document.getChapter(this.chapterId);
                if(this._chapter) {
                    this.chapterTitle = this._chapter.title;
                }
            }
            this.invalidate();
        }
        // webSkel.space.onChange(this.updateState);
        this._document.observeChange(this.updateState);
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