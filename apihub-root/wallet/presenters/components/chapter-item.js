import { Company } from "../../core/company.js";
import { getClosestParentElement } from "../../../WebSkel/utils/dom-utils.js";

export class chapterItem {
    constructor() {
        let currentCompany = Company.getInstance();
        this.chapterContent = "chapter's content";
        if(company.documents) {
            this._documentConfigs = company.documents;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = (companyState)=> {
            this._documentConfigs = company.documents;
            this.invalidate();
        }
        company.onChange(this.updateState);

        this.docId = company.currentDocumentId;
        this._document = company.getDocument(this.docId);
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

    async moveUp(_target) {
        let currentChapter = getClosestParentElement(_target, "chapter-item");//.getAttribute('data-id');
        let chapterAbove = currentChapter.previousSibling;//getClosestParentElement(_target, ".chapter-item").previousElementSibling.getAttribute('data-id');
        if(chapterAbove.nodeName === "CHAPTER-ITEM") {
            currentChapter.after(chapterAbove);
            await company.swapChapters(this.docId, parseInt(currentChapter.getAttribute('chapter-id')), parseInt(chapterAbove.getAttribute('chapter-id')));
        }
    }

    async moveDown(_target) {
        let currentChapter = getClosestParentElement(_target, "chapter-item");
        let chapterBelow = currentChapter.nextSibling;
        if(chapterBelow.nodeName === "CHAPTER-ITEM") {
            chapterBelow.after(currentChapter);
            await company.swapChapters(this.docId, parseInt(currentChapter.getAttribute('chapter-id')), parseInt(chapterBelow.getAttribute('chapter-id')));
        }
    }
}