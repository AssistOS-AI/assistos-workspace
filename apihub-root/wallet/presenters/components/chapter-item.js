import { getClosestParentElement } from "../../../WebSkel/utils/dom-utils.js";

export class chapterItem {
    constructor(element) {
        this.element = element;
        this.chapterContent = "Chapter's content";
        if(webSkel.company.documents) {
            this._documentConfigs = webSkel.company.documents;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
        this.documentService=webSkel.initialiseService('documentService');
        this.docId = webSkel.company.currentDocumentId;
        this._document = this.documentService.getDocument(this.docId);
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this.documentService.getChapter(this._document,this.chapterId);
    }

    beforeRender() {
        this.chapterId = parseInt(this.element.getAttribute("data-chapter-id"));
        this.chapter = this.documentService.getChapter(this._document,this.chapterId);
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
        let currentChapter = getClosestParentElement(_target, "chapter-item");
        let chapterAbove = currentChapter.previousSibling;
        if(chapterAbove.nodeName === "CHAPTER-ITEM") {
            currentChapter.after(chapterAbove);
            await this.documentService.swapChapters(this._document, parseInt(currentChapter.getAttribute('chapter-id')), parseInt(chapterAbove.getAttribute('chapter-id')));
        }
    }

    async moveDown(_target) {
        let currentChapter = getClosestParentElement(_target, "chapter-item");
        let chapterBelow = currentChapter.nextSibling;
        if(chapterBelow.nodeName === "CHAPTER-ITEM") {
            chapterBelow.after(currentChapter);
            await this.documentService.swapChapters(this._document, parseInt(currentChapter.getAttribute('chapter-id')), parseInt(chapterBelow.getAttribute('chapter-id')));
        }
    }
    /* undefined chapter? */
    selectChapter(_target) {
        console.log(_target);
        let selectedChapter = document.getElementById("selected-chapter");
        if(selectedChapter !== _target) {
            if(selectedChapter) {
                selectedChapter.removeAttribute("id");
            }
            _target.setAttribute("id", "selected-chapter");
        }
    }
}