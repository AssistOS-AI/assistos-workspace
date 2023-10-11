import {reverseQuerySelector} from "../../../../../WebSkel/utils/dom-utils.js";

export class chapterUnit {
    constructor(element,invalidate) {
        this.element = element;
        this._document=webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page", invalidate);
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(this.chapterId);
        this.chapterContent = "";
        if(this.chapter){
            if(this.chapter.visibility === "hide") {
                if(this.element.querySelector(".chapter-paragraphs")) {
                    this.element.querySelector(".chapter-paragraphs").classList.add("hidden");
                }
            }
        }

        this.chapter.paragraphs.forEach((paragraph) => {
            this.chapterContent += `<paragraph-unit data-paragraph-content="${paragraph.text}" data-paragraph-id="${paragraph.id}"></paragraph-unit>`;
        });

        document.removeEventListener("click", this.exitEditMode);
    }
    displaySidebar(sidebarID){
        const hideSidebar = (sidebarID) => {
            let sidebar = document.getElementById(sidebarID);
            if(!sidebar){
                throw("Can`t hide sidebar with id: " + sidebarID +" because it doesn`t exist");
            }else {
                sidebar.style.display = "none";
            }
        }
        const displaySidebar = (sidebarID) => {
            let sidebar = document.getElementById(sidebarID);
            if(!sidebar){
                throw("Can`t display sidebar with id: " + sidebarID+" because it doesn`t exist");
            }
            sidebar.style.display = "block";
        }
        switch(sidebarID){
            case "document-sidebar":
                hideSidebar("chapter-sidebar");
                hideSidebar("paragraph-sidebar");
                displaySidebar("document-sidebar");
                break;
            case "chapter-sidebar":
                hideSidebar("document-sidebar");
                hideSidebar("paragraph-sidebar");
                displaySidebar("chapter-sidebar");
                break;
            case "paragraph-sidebar":
                hideSidebar("document-sidebar");
                hideSidebar("chapter-sidebar");
                displaySidebar("paragraph-sidebar");
                break;
        }
    }
    showOrHideChapter(_target) {
        if (this.chapter.visibility === "hide") {
            this.chapter.visibility = "show";
        } else {
            this.chapter.visibility = "hide";
        }
        let paragraphs = this.element.querySelector(".chapter-paragraphs");
        paragraphs.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }

    async moveUp(_target) {
        let currentChapter = reverseQuerySelector(_target, "chapter-unit");
        let chapterAbove = currentChapter.previousSibling;
        if(chapterAbove.nodeName === "CHAPTER-UNIT") {
            currentChapter.after(chapterAbove);
            let currentChapterNumber = currentChapter.querySelector(".data-chapter-number").innerText.split(".")[0];
            let chapterAboveNumber = chapterAbove.querySelector(".data-chapter-number").innerText.split(".")[0];

            this._document.swapChapters(currentChapter.getAttribute('data-chapter-id'), chapterAbove.getAttribute('data-chapter-id'));

            await documentFactory.updateDocument(currentSpaceId, this._document);

            currentChapter.setAttribute("data-chapter-number", chapterAboveNumber);
            currentChapter.querySelector(".data-chapter-number").innerText = chapterAboveNumber + ".";
            chapterAbove.setAttribute("data-chapter-number", currentChapterNumber);
            chapterAbove.querySelector(".data-chapter-number").innerText = currentChapterNumber + ".";
            let chapterAboveId = chapterAbove.getAttribute("data-chapter-id");
            let chapterAboveIndex = this._document.chapters.findIndex(chp => chp.id === chapterAboveId);
            if(this._document.chapters[chapterAboveIndex].visibility === "hide") {
                chapterAbove.querySelector(".chapter-paragraphs").classList.add("hidden");
                chapterAbove.querySelector(".arrow").classList.add("rotate");
            }
        }
    }

    async moveDown(_target) {
        let currentChapter = reverseQuerySelector(_target, "chapter-unit");
        let chapterBelow = currentChapter.nextSibling;
        if(chapterBelow.nodeName === "CHAPTER-UNIT") {
            chapterBelow.after(currentChapter);
            this._document.swapChapters(currentChapter.getAttribute('data-chapter-id'), chapterBelow.getAttribute('data-chapter-id'));
            await documentFactory.updateDocument(currentSpaceId, this._document);

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
        let currentParagraph = reverseQuerySelector(_target, "paragraph-unit");
        let paragraphAbove = currentParagraph.previousSibling;
        let chapterElement = reverseQuerySelector(currentParagraph, "chapter-unit");
        let chapterId = chapterElement.getAttribute('data-chapter-id');
        let chapter = this._document.getChapter(chapterId);
        if(paragraphAbove && paragraphAbove.nodeName === "PARAGRAPH-UNIT") {
            currentParagraph.after(paragraphAbove);
            chapter.swapParagraphs(currentParagraph.getAttribute('data-paragraph-id'), paragraphAbove.getAttribute('data-paragraph-id'));
            await documentFactory.updateDocument(currentSpaceId, this._document);
        }
    }

    async moveParagraphDown(_target) {
        let currentParagraph = reverseQuerySelector(_target, "paragraph-unit");
        let paragraphBelow = currentParagraph.nextSibling;
        let chapterElement = reverseQuerySelector(currentParagraph, "chapter-unit");
        let chapterId = chapterElement.getAttribute('data-chapter-id');
        let chapter = this._document.getChapter(chapterId);
        if(paragraphBelow && paragraphBelow.nodeName === "PARAGRAPH-UNIT") {
            paragraphBelow.after(currentParagraph);
            chapter.swapParagraphs(currentParagraph.getAttribute('data-paragraph-id'), paragraphBelow.getAttribute('data-paragraph-id'));
            await documentFactory.updateDocument(currentSpaceId, this._document);
        }
    }

    openChapterSidebar(_target) {
        let target = reverseQuerySelector(_target, ".chapter-unit");
        this.displaySidebar("chapter-sidebar");
        target.setAttribute("id", "select-chapter-visualise");
        webSkel.space.currentChapterId = target.getAttribute('data-chapter-id');
    }

    afterRender() {
        let selectedParagraphs = this.element.querySelectorAll(".paragraph-text");
        selectedParagraphs.forEach(paragraph => {
            paragraph.addEventListener("dblclick", this.enterEditMode.bind(this, paragraph), true);
        });
    }
    async exitEditMode ([chapterId, paragraphId], event) {
        if (this && this.getAttribute("contenteditable") === "true" && !this.contains(event.target)) {
            this.setAttribute("contenteditable", "false");
            let updatedText = this.innerText;
            if(updatedText === '\n') {
                updatedText = '';
            }

            let doc = webSkel.space.getDocument(webSkel.space.currentDocumentId);
            let chapter = doc.getChapter(chapterId);
            if (updatedText !== chapter.getParagraph(paragraphId).text) {
                if (updatedText === null || updatedText.trim() === '') {
                    chapter.deleteParagraph(paragraphId);
                    if (chapter.paragraphs.length === 0) {
                        doc.removeChapter(chapterId);
                    }
                } else {
                    let paragraph = chapter.getParagraph(paragraphId);
                    paragraph.updateText(updatedText);
                }
                await documentFactory.updateDocument(currentSpaceId, doc);
                doc.notifyObservers(doc.getNotificationId());
            }
        }
        this.displaySidebar("document-sidebar");
    }

    enterEditMode(paragraph, event) {
        paragraph.setAttribute("id", "selected-chapter");
        paragraph.setAttribute("contenteditable", "true");
        paragraph.focus();
        event.stopPropagation();
        event.preventDefault();
        let chapterId = reverseQuerySelector(paragraph, ".chapter-unit").getAttribute("data-chapter-id");
        let paragraphId = reverseQuerySelector(paragraph, ".paragraph-unit").getAttribute("data-paragraph-id");
        document.addEventListener("click", this.exitEditMode.bind(paragraph, [chapterId, paragraphId]), true);
        webSkel.space.currentChapterId = chapterId;
        webSkel.space.currentParagraphId = paragraphId;
        this.displaySidebar("paragraph-sidebar");
    }
}



