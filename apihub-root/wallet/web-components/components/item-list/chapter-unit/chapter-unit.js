import {reverseQuerySelector} from "../../../../../WebSkel/utils/dom-utils.js";

export class chapterUnit {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(this.chapterId);
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page:" + "chapter:" + `${this.chapterId}`, invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.chapterContent = "";
        if (this.chapter) {
            if (this.chapter.visibility === "hide") {
                if (this.element.querySelector(".chapter-paragraphs")) {
                    this.element.querySelector(".chapter-paragraphs").classList.add("hidden");
                }
            }
        }
        this.chapter.paragraphs.forEach((paragraph) => {
            this.chapterContent += `<paragraph-unit data-paragraph-content="${paragraph.text}" data-paragraph-id="${paragraph.id}"></paragraph-unit>`;
        });
    }

    afterRender() {
        let selectedParagraphs = this.element.querySelectorAll(".paragraph-text");
        let currentParagraph = "";
        selectedParagraphs.forEach(paragraph => {
            paragraph.addEventListener("dblclick", this.enterEditMode.bind(this, paragraph), true);
            if (reverseQuerySelector(paragraph, '[data-paragraph-id]').getAttribute("data-paragraph-id") === webSkel.space.currentParagraphId) {
                currentParagraph = paragraph;
            }
        });
        if (this.chapter.id === webSkel.space.currentChapterId) {
            this.highlightChapter(this.element.querySelector(".chapter-text"));
            if (currentParagraph !== "") {
                this.enterEditMode(currentParagraph);
            }
        }
    }

    async documentClickHandler(event) {
        const editableParagraph = document.querySelector('[contenteditable="true"]');
        if (editableParagraph) {
            if (editableParagraph === event.target || editableParagraph.contains(event.target)) {
                return;
            } else {
                await this.saveEditedParagraph(editableParagraph);
                if (!reverseQuerySelector(event.target, ".chapter-unit")) {
                    webSkel.space.currentChapterId = null;
                    this.displaySidebar("document-sidebar");
                } else {
                    this.displaySidebar("chapter-sidebar");
                }
                webSkel.space.currentParagraphId = null;
                return;
            }
        }
        const highlightedChapter = document.getElementById("highlighted-chapter");
        if (highlightedChapter && highlightedChapter.contains(event.target)) {
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
    async saveEditedParagraph(editableParagraph) {
            editableParagraph.setAttribute("contenteditable", "false");
            let updatedText = editableParagraph.innerText;
            if (updatedText === '\n') {
                updatedText = '';
            }
            let currentDocument = webSkel.space.getDocument(webSkel.space.currentDocumentId);
            let currentChapter = currentDocument.getChapter(reverseQuerySelector(editableParagraph, ".chapter-unit").getAttribute("data-chapter-id"));
            let currentParagraph = currentChapter.getParagraph(reverseQuerySelector(editableParagraph, ".paragraph-unit").getAttribute("data-paragraph-id"));

            let updateRequired = false;
            if (updatedText === null || updatedText.trim() === '') {
                currentChapter.deleteParagraph(webSkel.space.currentParagraphId);
                updateRequired = true;
            } else if (updatedText !== currentParagraph.text) {
                currentParagraph.updateText(updatedText);
                updateRequired = true;
            }
            if (updateRequired) {
                await documentFactory.updateDocument(currentSpaceId, currentDocument);
                currentDocument.notifyObservers(currentDocument.getNotificationId() + ":document-view-page:" + "chapter:" + `${currentChapter.id}`);
            }
    }

    highlightChapter(_target) {
        let target = reverseQuerySelector(_target, ".chapter-unit");
        let previouslySelected = document.getElementById("highlighted-chapter");
        if (target && target.id === "highlighted-chapter") {
            return;
        }
        if (target && previouslySelected && target === previouslySelected) {
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
            document.removeEventListener("click", this.boundDocumentClickHandler, true);
            document.addEventListener("click", this.boundDocumentClickHandler, true);
        } else {
            console.error(`Failed highlighting a chapter, click target: ${target}`);
            this.displaySidebar("document-sidebar");
        }
    }

    enterEditMode(paragraph, event) {
        paragraph.setAttribute("id", "selected-chapter");
        paragraph.setAttribute("contenteditable", "true");
        paragraph.focus();
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        webSkel.space.currentParagraphId = reverseQuerySelector(paragraph, ".paragraph-unit").getAttribute("data-paragraph-id");
        this.displaySidebar("paragraph-sidebar");
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
        this.chapter.visibility === "hide" ? this.chapter.visibility = "show" : this.chapter.visibility = "hide";
        let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
        paragraphsContainer.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }

    async moveChapter(_target, direction) {
        let currentChapter = reverseQuerySelector(_target, "chapter-unit");
        let adjacentChapter;

        direction === "up"
            ?adjacentChapter = currentChapter.previousSibling
            :adjacentChapter = currentChapter.nextSibling

        let currentChapterId= currentChapter.getAttribute('data-chapter-id');
        let adjacentChapterId= adjacentChapter.getAttribute('data-chapter-id');

        if(adjacentChapter && currentChapter){
            if(this._document.swapChapters(currentChapterId, adjacentChapterId) === true){
                await documentFactory.updateDocument(currentSpaceId, this._document);
                this._document.notifyObservers(this._document.getNotificationId() + ":refresh");
            }
        }
    }


    async moveParagraph(_target, direction) {
        const editableParagraph = document.querySelector('[contenteditable="true"]');
        if (editableParagraph) {
            await this.saveEditedParagraph(editableParagraph);
        }
        let currentParagraph = reverseQuerySelector(_target, "paragraph-unit");
        let adjacentParagraph;

        direction === "up"
            ? adjacentParagraph = currentParagraph.previousSibling
            : adjacentParagraph = currentParagraph.nextSibling;

        let currentParagraphId= currentParagraph.getAttribute('data-paragraph-id');
        let adjacentParagraphId= adjacentParagraph.getAttribute('data-paragraph-id');
        let chapterId=reverseQuerySelector(_target, "chapter-unit").getAttribute('data-chapter-id');

        if(adjacentParagraph && currentParagraph){
            if(this.chapter.swapParagraphs(currentParagraphId, adjacentParagraphId)===true) {
                await documentFactory.updateDocument(currentSpaceId, this._document);
                this._document.notifyObservers(this._document.getNotificationId() + ":document-view-page:" + "chapter:" + `${chapterId}`);
            }
        }
    }

}



