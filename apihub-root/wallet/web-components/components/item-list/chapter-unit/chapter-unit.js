import {DocumentModel, documentViewPage, getClosestParentElement, Paragraph} from "../../../../imports.js";

export class chapterUnit {
    constructor(element) {
        this.element = element;
        this.chapterContent = "Chapter's content";
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
        this.docId = webSkel.space.currentDocumentId;
        this._document = webSkel.space.getDocument(this.docId);
        this._document.observeChange(this._document.getNotifyId(), this.updateState);
    }

    beforeRender() {
        this.chapterId = parseInt(this.element.getAttribute("data-chapter-id"));
        this.chapter = this._document.getChapter(this.chapterId);
        this.chapterContent = "";
        if(this.chapter && this.chapter.visibility === "hide") {
            if(this.element.querySelector(".chapter-paragraphs")) {
                this.element.querySelector(".chapter-paragraphs").classList.add("hidden");
            }
        }
        if(this.chapter && this.chapter.paragraphs) {
            this.chapter.paragraphs.forEach((paragraph) => {
                this.chapterContent += `<paragraph-unit data-paragraph-content="${paragraph.text}" data-paragraph-id="${paragraph.id}"></paragraph-unit>`;
            });
        }
        let selectedParagraphs = this.element.querySelectorAll(".paragraph-text");
        selectedParagraphs.forEach(paragraph => {
            paragraph.removeEventListener("dblclick", enterEditMode, true);
        });
        document.removeEventListener("click", exitEditMode);
        delete document.selectedChapter;
    }

    showOrHideChapter(_target) {
        if (this.chapter.visibility === "hide") {
            this.chapter.visibility = "show";
        } else {
            this.chapter.visibility = "hide";
        }
        _target.parentNode.nextElementSibling.firstElementChild.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }

    async moveUp(_target) {
        let currentChapter = getClosestParentElement(_target, "chapter-unit");
        let chapterAbove = currentChapter.previousSibling;
        if(chapterAbove.nodeName === "CHAPTER-UNIT") {
            currentChapter.after(chapterAbove);
            let currentChapterNumber = currentChapter.querySelector(".data-chapter-number").innerText.split(".")[0];
            let chapterAboveNumber = chapterAbove.querySelector(".data-chapter-number").innerText.split(".")[0];

            let chapter1Index = this._document.chapters.findIndex(chapter => chapter.id === parseInt(currentChapter.getAttribute('data-chapter-id')));
            let chapter2Index = this._document.chapters.findIndex(chapter => chapter.id === parseInt(chapterAbove.getAttribute('data-chapter-id')));
            await this._document.swapChapters(chapter1Index, chapter2Index);
            await storageManager.storeObject(currentSpaceId, "documents", this._document.id, this._document.stringifyDocument());

            currentChapter.setAttribute("data-chapter-number", chapterAboveNumber);
            currentChapter.querySelector(".data-chapter-number").innerText = chapterAboveNumber + ".";
            chapterAbove.setAttribute("data-chapter-number", currentChapterNumber);
            chapterAbove.querySelector(".data-chapter-number").innerText = currentChapterNumber + ".";
            let chapterAboveId = chapterAbove.getAttribute("data-chapter-id");
            let chapterAboveIndex = this._document.chapters.findIndex(chp => chp.id === parseInt(chapterAboveId));
            if(this._document.chapters[chapterAboveIndex].visibility === "hide") {
                chapterAbove.querySelector(".chapter-paragraphs").classList.add("hidden");
                chapterAbove.querySelector(".arrow").classList.add("rotate");
            }
        }
    }

    async moveDown(_target) {
        let currentChapter = getClosestParentElement(_target, "chapter-unit");
        let chapterBelow = currentChapter.nextSibling;
        if(chapterBelow.nodeName === "CHAPTER-UNIT") {
            chapterBelow.after(currentChapter);
            let chapter1Index = this._document.chapters.findIndex(chapter => chapter.id === parseInt(currentChapter.getAttribute('data-chapter-id')));
            let chapter2Index = this._document.chapters.findIndex(chapter => chapter.id === parseInt(chapterBelow.getAttribute('data-chapter-id')));
            await this._document.swapChapters(chapter1Index, chapter2Index);
            await storageManager.storeObject(currentSpaceId, "documents", this._document.id, this._document.stringifyDocument());

            let currentChapterNumber = currentChapter.querySelector(".data-chapter-number").innerText.split(".")[0];
            let chapterBelowNumber = chapterBelow.querySelector(".data-chapter-number").innerText.split(".")[0];

            chapterBelow.setAttribute("data-chapter-number", currentChapterNumber);
            chapterBelow.querySelector(".data-chapter-number").innerText = currentChapterNumber + ".";
            currentChapter.setAttribute("data-chapter-number", chapterBelowNumber);
            currentChapter.querySelector(".data-chapter-number").innerText = chapterBelowNumber + ".";

            if (this.chapter.visibility === "hide") {
                this.element.querySelector(".chapter-paragraphs").classList.add("hidden");
                this.element.querySelector(".arrow").classList.add("rotate");
            }
        }
    }

    async moveParagraphUp(_target) {
        let currentParagraph = getClosestParentElement(_target, "paragraph-unit");
        let paragraphAbove = currentParagraph.previousSibling;
        let chapter = getClosestParentElement(currentParagraph, "chapter-unit");
        let chapterId = chapter.getAttribute('data-chapter-id');
        let chapterIndex = this._document.chapters.findIndex(chapter => chapter.id === parseInt(chapterId));
        if(paragraphAbove && paragraphAbove.nodeName === "PARAGRAPH-UNIT") {
            currentParagraph.after(paragraphAbove);
            let paragraph1Index = this._document.chapters.findIndex(paragraph => paragraph.id === parseInt(currentParagraph.getAttribute('data-paragraph-id')));
            let paragraph2Index = this._document.chapters.findIndex(paragraph => paragraph.id === parseInt(paragraphAbove.getAttribute('data-paragraph-id')));

            await this._document.swapParagraphs(chapterIndex, paragraph1Index, paragraph2Index);
            await storageManager.storeObject(currentSpaceId, "documents", this._document.id, this._document.stringifyDocument());

        }
    }

    async moveParagraphDown(_target) {
        let currentParagraph = getClosestParentElement(_target, "paragraph-unit");
        let paragraphBelow = currentParagraph.nextSibling;
        let chapter = getClosestParentElement(currentParagraph, "chapter-unit");
        let chapterId = chapter.getAttribute('data-chapter-id');
        let chapterIndex = this._document.chapters.findIndex(chapter => chapter.id === parseInt(chapterId));
        if(paragraphBelow && paragraphBelow.nodeName === "PARAGRAPH-UNIT") {
            paragraphBelow.after(currentParagraph);
            let paragraph1Index = this._document.chapters.findIndex(paragraph => paragraph.id === parseInt(currentParagraph.getAttribute('data-paragraph-id')));
            let paragraph2Index = this._document.chapters.findIndex(paragraph => paragraph.id === parseInt(paragraphBelow.getAttribute('data-paragraph-id')));
            await this._document.swapParagraphs(chapterIndex, paragraph1Index, paragraph2Index);
            await storageManager.storeObject(currentSpaceId, "documents", this._document.id, this._document.stringifyDocument());

        }
    }

    openChapterSidebar(_target) {
        let target = getClosestParentElement(_target, ".chapter-unit");
        let chapterId = target.getAttribute('data-chapter-id');
        documentViewPage.openChapterSidebar( chapterId);
        target.setAttribute("id", "select-chapter-visualise");
        webSkel.space.currentChapterId = chapterId;
    }

    afterRender() {
        let selectedParagraphs = this.element.querySelectorAll(".paragraph-text");
        selectedParagraphs.forEach(paragraph => {
            paragraph.addEventListener("dblclick", enterEditMode, true);
        });
    }
}

function enterEditMode(event) {
    this.setAttribute("id", "selected-chapter");
    this.setAttribute("contenteditable", "true");
    this.focus();
    event.stopPropagation();
    event.preventDefault();
    document.addEventListener("click", exitEditMode, true);
    document.selectedChapter = this;
    let chapterId = parseInt(getClosestParentElement(this, ".chapter-unit").getAttribute("data-chapter-id"));
    let paragraphId = parseInt(getClosestParentElement(this, ".paragraph-unit").getAttribute("data-paragraph-id"));
    documentViewPage.openParagraphSidebar(chapterId, paragraphId);
}

async function exitEditMode(event) {
    if (this.selectedChapter && this.selectedChapter.getAttribute("contenteditable") === "true" && !this.selectedChapter.contains(event.target)) {
        this.selectedChapter.setAttribute("contenteditable", "false");
        let updatedText = this.selectedChapter.innerText;
        if(updatedText === '\n') {
            updatedText = '';
        }
        let documentId = parseInt(getClosestParentElement(this.selectedChapter, "document-view-page").getAttribute("data-document-id"));
        let documentIndex = webSkel.space.documents.findIndex(doc => doc.id === documentId);
        let doc = webSkel.space.documents.find(doc => doc.id === documentId);
        let chapterId = parseInt(getClosestParentElement(this.selectedChapter, ".chapter-unit").getAttribute("data-chapter-id"));
        let paragraphId = parseInt(getClosestParentElement(this.selectedChapter, ".paragraph-unit").getAttribute("data-paragraph-id"));
        let sidebar = document.getElementById("paragraph-sidebar");
        sidebar.style.display = "none";
        if (documentIndex !== -1 && updatedText !== this.chapter) {
            if (updatedText === null || updatedText.trim() === '') {
                doc.removeParagraph(chapterId, paragraphId);
                if (doc.getChapterParagraphs(chapterId).length === 0) {
                    doc.removeChapter(chapterId);
                }
            } else {
                doc.updateParagraphText(chapterId, paragraphId, updatedText);
            }
            await storageManager.storeObject(currentSpaceId, "documents", doc.id, doc.stringifyDocument());
        }
    }
}