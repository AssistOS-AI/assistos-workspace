import { Company } from "../../core/company.js";
import { getClosestParentElement } from "../../../WebSkel/utils/dom-utils.js";

export class chapterItem {
    constructor() {
        let currentCompany = Company.getInstance();
        this.chapterContent = "chapter's content";
        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = (companyState)=> {
            this._documentConfigs = companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
        this.docId = webSkel.registry.currentDocumentId;
        this._document = webSkel.registry.getDocument(this.docId);
        this.chapter = this._document.getCurrentChapter();
    }

    beforeRender() {
        this.chapterContent = "";
        this.chapter.paragraphs.forEach((paragraph) => {
            this.chapterContent += `<paragraph-item data-paragraph-content="${paragraph.text}"></paragraph-item>`;
        });
    }

    showOrHideChapter(_target, chapterId) {
        _target.parentNode.nextElementSibling.firstElementChild.nextElementSibling.classList.toggle('hidden');
        _target.parentNode.nextElementSibling.firstElementChild.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }

    moveUp(_target) {
        let currentChapter = getClosestParentElement(_target, "chapter-item");
        let chapterAbove = currentChapter.previousSibling;
        if(chapterAbove.nodeName === "CHAPTER-ITEM") {
            currentChapter.after(chapterAbove);
            webSkel.registry.swapChapters(this.docId, parseInt(currentChapter.getAttribute('chapter-id')), parseInt(chapterAbove.getAttribute('chapter-id')));
            const documentIndex = webSkel.registry.storageData.documents.findIndex(doc => doc.id === this.docId);
            const currentCompany = Company.getInstance();
            currentCompany.companyState.documents[documentIndex] = webSkel.registry.storageData.documents[documentIndex];
        }
    }

    moveDown(_target) {
        let currentChapter = getClosestParentElement(_target, "chapter-item");
        let chapterBelow = currentChapter.nextSibling;
        if(chapterBelow.nodeName === "CHAPTER-ITEM") {
            chapterBelow.after(currentChapter);
            webSkel.registry.swapChapters(this.docId, parseInt(currentChapter.getAttribute('chapter-id')), parseInt(chapterBelow.getAttribute('chapter-id')));
            const documentIndex = webSkel.registry.storageData.documents.findIndex(doc => doc.id === this.docId);
            const currentCompany = Company.getInstance();
            currentCompany.companyState.documents[documentIndex] = webSkel.registry.storageData.documents[documentIndex];
        }
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}