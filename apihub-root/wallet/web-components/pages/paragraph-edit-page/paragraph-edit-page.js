import { closeModal, DocumentModel, showActionBox } from "../../../imports.js";

export class paragraphEditPage {
    constructor() {
        let url = window.location.hash;
        this.docId =  url.split('/')[1];
        this.chapterId = url.split('/')[3];
        this.paragraphId = url.split('/')[4];
        this._document = webSkel.space.getDocument(this.docId);
        if(this._document) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
            this._chapter = this._document.getChapter(this.chapterId);
            if(this._chapter) {
                this._paragraph = this._document.getParagraph(this.chapterId, this.paragraphId);
                this.paragraphDiv = this._paragraph;
                this._document.observeChange(this._paragraph.getNotificationId(this.chapterId), this.updateState);
            } else {
                console.log(`this chapter doesnt exist: chapterId: ${this.chapterId}`);
            }
        } else {
            console.log(`this _document doesnt exist: docId: ${this.docId}`);
        }
        this.updateState = ()=> {
            this._document = webSkel.space.getDocument(this.docId);
            if(this._document) {
                this._chapter = this._document.getChapter(this.chapterId);
                if(this._chapter) {
                    this.chapterTitle = this._document.getChapterTitle(this.chapterId);
                } else {
                    console.log(`this chapter doesnt exist: ${this.chapterId}`);
                }
            } else {
                console.log(`this _document doesnt exist: ${this.docId}`);
            }
            this.invalidate();
        }
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

    openViewPage() {
        webSkel.changeToStaticPage(`documents/${this.docId}`);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    openParagraphProofreadPage() {
        webSkel.changeToStaticPage(`documents/${this.docId}/paragraph-proofread/${this.chapterId}/${this.paragraphId}`);
    }

    openParagraphEditPage() {
        webSkel.changeToStaticPage(`documents/${this.docId}/paragraph-edit/${this.chapterId}/${this.paragraphId}`);
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}