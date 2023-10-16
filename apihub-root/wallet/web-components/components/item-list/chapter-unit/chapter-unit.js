import {reverseQuerySelector} from "../../../../../WebSkel/utils/dom-utils.js";

export class chapterUnit {
    constructor(element,invalidate) {
        this.element = element;
        this._document=webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(this.chapterId);
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page:"+"chapter:"+`${this.chapterId}`, invalidate);
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
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
    afterRender() {
        let selectedParagraphs = this.element.querySelectorAll(".paragraph-text");
        let currentParagraph="";
        selectedParagraphs.forEach(paragraph => {
            paragraph.addEventListener("dblclick", this.enterEditMode.bind(this, paragraph), true);
            if(reverseQuerySelector(paragraph,'[data-paragraph-id]').getAttribute("data-paragraph-id")===webSkel.space.currentParagraphId){
                currentParagraph=paragraph;
            }
        });
        if(this.chapter.id===webSkel.space.currentChapterId){
            this.highlightChapter(this.element.querySelector(".chapter-text"));
            if(currentParagraph!=="") {
                this.enterEditMode(currentParagraph);
            }
        }
    }
     displaySidebar(sidebarID) {
            document.querySelectorAll(".item-list").forEach(sidebar => sidebar.style.display = "none");
            const desiredSidebar = document.getElementById(sidebarID);
            if (desiredSidebar) {
                desiredSidebar.style.display = "block";
            } else {
                console.error("Can't find sidebar with id:", sidebarID);
            }
        }
    changeChapterDisplay(_target) {
        this.chapter.visibility === "hide"?this.chapter.visibility = "show":this.chapter.visibility = "hide";
        let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
        paragraphsContainer.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }

    async moveChapter(_target, direction) {
        let currentChapter = reverseQuerySelector(_target, "chapter-unit");
        let adjacentChapter;
        if (direction === "up") {
            adjacentChapter = currentChapter.previousSibling;
        } else if (direction === "down") {
            adjacentChapter = currentChapter.nextSibling;
        }
        if (adjacentChapter && adjacentChapter.nodeName === "CHAPTER-UNIT") {
            if (direction === "up") {
                adjacentChapter.after(currentChapter);
            } else {
                adjacentChapter.before(currentChapter);
            }

            this._document.swapChapters(currentChapter.getAttribute('data-chapter-id'), adjacentChapter.getAttribute('data-chapter-id'));
            await documentFactory.updateDocument(currentSpaceId, this._document);
            this._document.notifyObservers(this._document.getNotificationId() + ":refresh");
        }
    }


    async moveParagraph(_target, direction) {
        let currentParagraph = reverseQuerySelector(_target, "paragraph-unit");
        let adjacentParagraph;

        if (direction === "up") {
            adjacentParagraph = currentParagraph.previousSibling;
        } else if (direction === "down") {
            adjacentParagraph = currentParagraph.nextSibling;
        }

        if (adjacentParagraph && adjacentParagraph.nodeName === "PARAGRAPH-UNIT") {
            if (direction === "up") {
                currentParagraph.after(adjacentParagraph);
                this.chapter.swapParagraphs(currentParagraph.getAttribute('data-paragraph-id'), adjacentParagraph.getAttribute('data-paragraph-id'));
            } else {
                adjacentParagraph.after(currentParagraph);
                this.chapter.swapParagraphs(currentParagraph.getAttribute('data-paragraph-id'), adjacentParagraph.getAttribute('data-paragraph-id'));
            }
            await documentFactory.updateDocument(currentSpaceId, this._document);
            this._document.notifyObservers(this._document.getNotificationId() + ":document-view-page:"+"chapter:"+`${this.chapterId}`);
        }
    }

    documentClickHandler(event) {
        const editableParagraph = document.querySelector('[contenteditable="true"]');
        if (editableParagraph && (editableParagraph === event.target || editableParagraph.contains(event.target))) {
            return;
        }

        const highlightedChapter = document.getElementById("highlighted-chapter");
        if (highlightedChapter && highlightedChapter.contains(event.target) && !editableParagraph) {
            return;
        }

        if (!event.target.closest('.chapter-unit')) {
            let selectedChapter = document.getElementById("highlighted-chapter");
            if (selectedChapter) {
                selectedChapter.removeAttribute("id");
            }
            this.displaySidebar('document-sidebar');
            document.removeEventListener('click', this.boundDocumentClickHandler, true);
            delete this.boundDocumentClickHandler;
        }
    }

    highlightChapter(_target) {
        let target = reverseQuerySelector(_target, ".chapter-unit");
        let previouslySelected = document.getElementById("highlighted-chapter");
        if(target && target.id === "highlighted-chapter") {
            return;
        }
        if (target === previouslySelected) {
            this.displaySidebar("chapter-sidebar");
            return;
        }
        if (previouslySelected) {
            previouslySelected.removeAttribute("id");
        }
        if (target) {
            target.setAttribute("id", "highlighted-chapter");
            webSkel.space.currentChapterId = target.getAttribute('data-chapter-id');
            this.displaySidebar("chapter-sidebar");

            if (!this.boundDocumentClickHandler) {
                this.boundDocumentClickHandler = this.documentClickHandler.bind(this);
            }
            document.addEventListener("click", this.boundDocumentClickHandler, true);
        } else {
            console.error(`Failed highlighting a chapter, click target: ${target}`);
        }
    }

    enterEditMode(paragraph, event) {
        paragraph.setAttribute("id", "selected-chapter");
        paragraph.setAttribute("contenteditable", "true");
        paragraph.focus();
        if(event) {
            event.stopPropagation();
            event.preventDefault();
        }

        let chapterId = reverseQuerySelector(paragraph, ".chapter-unit").getAttribute("data-chapter-id");
        let paragraphId = reverseQuerySelector(paragraph, ".paragraph-unit").getAttribute("data-paragraph-id");

        this.boundExitEditMode = this.exitEditMode.bind(this, paragraph, chapterId, paragraphId, this.displaySidebar);
        document.addEventListener("click", this.boundExitEditMode, true);

        webSkel.space.currentChapterId = chapterId;
        webSkel.space.currentParagraphId = paragraphId;
        this.displaySidebar("paragraph-sidebar");
    }

    async exitEditMode(paragraph, chapterId, paragraphId, displaySidebar, event) {
        if (paragraph.getAttribute("contenteditable") === "true" && !paragraph.contains(event.target) && paragraph !== event.target){
            paragraph.setAttribute("contenteditable", "false");
            let updatedText = paragraph.innerText;
            if (updatedText === '\n') {
                updatedText = '';
            }

            let currentDocument = webSkel.space.getDocument(webSkel.space.currentDocumentId);
            let currentChapter  = currentDocument.getChapter(chapterId);
            let currentParagraph= currentChapter.getParagraph(paragraphId);

            let updateRequired = false;
            if (updatedText === null || updatedText.trim() === '') {
                currentChapter.deleteParagraph(paragraphId);
                updateRequired = true;
            } else if (updatedText !== currentParagraph.text) {
                currentParagraph.updateText(updatedText);
                updateRequired = true;
            }
            if (updateRequired) {
                await documentFactory.updateDocument(currentSpaceId, currentDocument);
                currentDocument.notifyObservers(currentDocument.getNotificationId() + ":document-view-page:" + "chapter:" + `${chapterId}`);
            }

            webSkel.space.currentChapterId = null;
            webSkel.space.currentParagraphId = null;
            displaySidebar("document-sidebar");
        }
        if (this.boundExitEditMode) {
            document.removeEventListener("click", this.boundExitEditMode, true);
            delete this.boundExitEditMode;
        }

    }



}



