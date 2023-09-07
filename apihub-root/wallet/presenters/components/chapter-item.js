import { getClosestParentElement } from "../../../WebSkel/utils/dom-utils.js";

export class chapterItem {
    constructor(element) {
        this.element = element;
        this.chapterContent = "Chapter's content";
        if(company.documents) {
            this._documentConfigs = company.documents;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._documentConfigs = company.documents;
            this.invalidate();
        }
        company.onChange(this.updateState);
        this.docId = company.currentDocumentId;
        this._document = company.getDocument(this.docId);
        this.chapter = this._document.getCurrentChapter();
    }

    beforeRender() {
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(parseInt(this.chapterId));
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

    afterRender() {
        this.selectedChapter = this.element.firstElementChild.nextElementSibling;
        this.selectedChapter.addEventListener("dblclick", setEditableChapter, true);
        document.addEventListener("click", removeEventForDocument, true);
    }
}

function setEditableChapter(event) {
    this.setAttribute("id", "selected-chapter");
    this.setAttribute("contenteditable", "true");
    this.focus();
    event.stopPropagation();
    event.preventDefault();
}

function removeEventForDocument(event) {
    this.selectedChapter = document.querySelector("[contenteditable='true']");
    if(this.selectedChapter && this.selectedChapter.getAttribute("contenteditable") === "true" && !this.selectedChapter.contains(event.target)) {
        this.selectedChapter.setAttribute("contenteditable", "false");
        let updatedText = document.querySelector(".chapter-paragraphs").innerText;
        let updatedTitle = document.querySelector(".chapter-title").innerText;
        const documentId = this.selectedChapter.getAttribute("data-id");
        // const documentIndex = company.documents.findIndex(doc => doc.id === documentId);
        // if (documentIndex !== -1 && updatedAbstract !== company.documents[documentIndex].abstract) {
        //     for(let i = 0; i < updatedAbstract.length; i++) {
        //         if(updatedAbstract[i] === '\n') {
        //             let numberOfNewLines = 0;
        //             let initialIndex = i;
        //             while(updatedAbstract[i] === '\n') {
        //                 i++;
        //                 numberOfNewLines++;
        //             }
        //             numberOfNewLines = Math.floor(numberOfNewLines / 2) + 1;
        //             let newLineString = "";
        //             for(let j = 0; j < numberOfNewLines; j++) {
        //                 newLineString += "<br>";
        //             }
        //             updatedAbstract = updatedAbstract.slice(0, initialIndex) + newLineString + updatedAbstract.slice(i);
        //         }
        //     }
        //     company.documents[documentIndex].abstract = updatedAbstract;
        //     await company.updateDocument(documentId, company.documents[documentIndex]);
    }
}