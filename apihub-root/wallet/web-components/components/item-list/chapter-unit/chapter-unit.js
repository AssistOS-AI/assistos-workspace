import {getClosestParentElement, reverseQuerySelector} from "../../../../imports.js";

export class chapterUnit {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(this.chapterId);
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page:" + "chapter:" + `${this.chapterId}`, invalidate);
        this.invalidate = invalidate;
        this.invalidate();
        this.addParagraphOnCtrlEnter = this.addParagraphOnCtrlEnter.bind(this);
        this.element.removeEventListener('keydown', this.addParagraphOnCtrlEnter);
        this.element.addEventListener('keydown', this.addParagraphOnCtrlEnter);
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
            if (reverseQuerySelector(paragraph, '[data-paragraph-id]').getAttribute("data-paragraph-id") === webSkel.space.currentParagraphId) {
                currentParagraph = paragraph;
            }
            paragraph.addEventListener("click", (event) => {
                if (paragraph.getAttribute("contenteditable") !== "true") {
                    this.highlightChapter(paragraph.closest(".chapter-unit"));
                    this.enterEditMode(paragraph, event);
                }
            }, true);
        });
        if (this.chapter.id === webSkel.space.currentChapterId) {
            this.highlightChapter(this.element.querySelector(".chapter-text"));
            if (currentParagraph !== "") {
                this.enterEditMode(currentParagraph);
            }
        }
    }
    alternateArrowsDisplay(target, type) {
        if(type==="chapter"){
            if(this._document.chapters.length===1){
                return;
            }
        }
        if(type==="paragraph"){
            if(this.chapter.paragraphs.length===1){
                return;
            }
        }
        const arrowsSelector = type === "chapter" ? '.chapter-arrows' : '.paragraph-arrows';
        let foundElement = target.querySelector(arrowsSelector);
        if (!foundElement) {
            let nextSibling = target.nextElementSibling;
            while (nextSibling) {
                if (nextSibling.matches(arrowsSelector)) {
                    foundElement = nextSibling;
                    break;
                }
                nextSibling = nextSibling.nextElementSibling;
            }
        }
        if (foundElement) {
            foundElement.style.display = foundElement.style.display === "flex" ? "none" : "flex";
        }
    }
    alternateChapterEditButtons(_target,documentClick) {
        if(documentClick){
            document.querySelectorAll(".edit-chapter-title-button").forEach((editTitleButton)=>editTitleButton.style.display = "none");
            return;
        }
        let chapterEditButton=_target.querySelector(".edit-chapter-title-button");
        if(!chapterEditButton) {
            chapterEditButton = reverseQuerySelector(_target, ".edit-chapter-title-button", 'chapter-unit');
        }
         if(chapterEditButton) {
            window.getComputedStyle(chapterEditButton).getPropertyValue("display") === "none" ? chapterEditButton.style.display = "flex" : chapterEditButton.style.display = "none";
        }
    }
    async enterChapterTitleEditMode(_target){
        let chapterTitle=_target.querySelector(".chapter-title");
        if(!chapterTitle) {
            chapterTitle = reverseQuerySelector(_target, ".chapter-title", 'chapter-unit');
        }
        if(chapterTitle) {
            chapterTitle.setAttribute("contenteditable", "true");
            chapterTitle.focus();
        }
    }
    async addParagraphOnCtrlEnter(event) {
        if (!event.ctrlKey || event.key !== 'Enter') {
            return;
        }
        const fromParagraph = reverseQuerySelector(event.target, '[data-paragraph-id]','chapter-unit');
        const fromChapter = reverseQuerySelector(event.target, '.chapter-unit');

        if (!fromParagraph && !fromChapter) {
            return;
        }
        const editableParagraph = document.querySelector('[contenteditable="true"]');
        if (editableParagraph) {
            await this.saveEditedParagraph(editableParagraph);
        }
        let paragraphPosition=null;
        if(fromParagraph){
                paragraphPosition=this.chapter.getParagraphIndex(fromParagraph.getAttribute("data-paragraph-id"))+1;
        }else{
                paragraphPosition=this.chapter.paragraphs.length;
        }
        await this.addNewParagraph(paragraphPosition);
        this._document.notifyObservers(this._document.getNotificationId()+":document-view-page:"+"chapter:"+`${this.chapter.id}`);
    }

    async addNewParagraph(paragraphPosition){
        let newParagraphId=webSkel.getService("UtilsService").generateId();
        await this.chapter.addParagraph({id: newParagraphId, text:""},paragraphPosition);
        webSkel.space.currentChapterId=this.chapter.id;
        webSkel.space.currentParagraphId=newParagraphId;
        this._document.notifyObservers(this._document.getNotificationId()+":document-view-page:"+"chapter:"+`${this.chapter.id}`);
    }
    async documentClickHandler(event) {
        const editableUnit = document.querySelector('[contenteditable="true"]');
        if (editableUnit) {
            if (editableUnit === event.target || editableUnit.contains(event.target)) {
                return;
            } else {
                if(editableUnit.classList.contains("chapter-title")) {
                        await this.saveEditedChapterTitle(editableUnit);
                }else{
                    if(editableUnit.classList.contains("paragraph-text")){
                        await this.saveEditedParagraph(editableUnit);
                        this.displaySidebar("chapter-sidebar");
                        this.alternateArrowsDisplay(editableUnit, "paragraph");
                    }
                }
            }
        }
        const highlightedChapter = document.getElementById("highlighted-chapter");
        if (highlightedChapter && highlightedChapter.contains(event.target)) {
            return;
        }
        if (!event.target.closest('.chapter-unit') && !getClosestParentElement(event.target,'.sidebar-item')) {
            let selectedChapter = document.getElementById("highlighted-chapter");
            if (selectedChapter) {
                selectedChapter.removeAttribute("id");
                this.alternateArrowsDisplay(selectedChapter, "chapter");
                this.alternateChapterEditButtons(event.target,"document-click");
            }
            this.displaySidebar('document-sidebar');
            webSkel.space.currentChapterId = null;
            webSkel.space.currentParagraphId=null;
        }
        document.removeEventListener('click', this.boundDocumentClickHandler, true);
        delete this.boundDocumentClickHandler;
    }
    async saveEditedChapterTitle(editableUnit){
        editableUnit.setAttribute("contenteditable", "false");
        let updatedTitle = editableUnit.innerText;
        if (updatedTitle === '\n') {
            updatedTitle = '';
        }
        let currentDocument = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        let currentChapter = currentDocument.getChapter(reverseQuerySelector(editableUnit, ".chapter-unit").getAttribute("data-chapter-id"));
        let updateRequired = false;
        if (updatedTitle === null || updatedTitle.trim() === '') {
            updateRequired=false;
            editableUnit.innerText=currentChapter.title;
        } else if (updatedTitle !== currentChapter.title) {
            currentChapter.updateTitle(updatedTitle);
            updateRequired = true;
        }
        if (updateRequired) {
            await documentFactory.updateDocument(currentSpaceId, currentDocument);
            this._document.notifyObservers(`${this._document.getNotificationId()}:refresh`);
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
            return;
        }
        if (previouslySelected) {
            previouslySelected.removeAttribute("id");
            this.alternateArrowsDisplay(previouslySelected, "chapter");
            this.alternateChapterEditButtons(previouslySelected.querySelector('.edit-chapter-title-button'));
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
            this.alternateArrowsDisplay(target, "chapter")
            this.alternateChapterEditButtons(target);

        } else {
            console.error(`Failed highlighting a chapter, click target: ${target}`);
            this.displaySidebar("document-sidebar");
        }
    }

    enterEditMode(paragraph, event) {
        paragraph.setAttribute("id", "selected-chapter");
        paragraph.setAttribute("contenteditable", "true");
        paragraph.focus();
        this.alternateArrowsDisplay(paragraph, "paragraph");
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
        const currentChapter = reverseQuerySelector(_target, "chapter-unit");
        const currentChapterId = currentChapter.getAttribute('data-chapter-id');
        const currentChapterIndex = this._document.getChapterIndex(currentChapterId);

        const getAdjacentChapterId = (index, chapters) => {
            if (direction === "up") {
                return index === 0 ? chapters[chapters.length - 1].id : chapters[index - 1].id;
            }
            return index === chapters.length - 1 ? chapters[0].id : chapters[index + 1].id;
        };

        const adjacentChapterId = getAdjacentChapterId(currentChapterIndex, this._document.chapters);

        if (this._document.swapChapters(currentChapterId, adjacentChapterId)) {
            await documentFactory.updateDocument(currentSpaceId, this._document);
            this._document.notifyObservers(`${this._document.getNotificationId()}:refresh`);
        } else {
            console.error(`Unable to swap chapters. ${currentChapterId}, ${adjacentChapterId}`);
        }
    }


    async moveParagraph(_target, direction) {
        const currentParagraph = reverseQuerySelector(_target, "paragraph-unit");
        const currentParagraphId = currentParagraph.getAttribute('data-paragraph-id');
        const currentParagraphIndex = this.chapter.getParagraphIndex(currentParagraphId);

        const getAdjacentParagraphId = (index, paragraphs) => {
            if (direction === "up") {
                return index === 0 ? paragraphs[paragraphs.length - 1].id : paragraphs[index - 1].id;
            }
            return index === paragraphs.length - 1 ? paragraphs[0].id : paragraphs[index + 1].id;
        };

        const adjacentParagraphId = getAdjacentParagraphId(currentParagraphIndex, this.chapter.paragraphs);
        const chapterId = reverseQuerySelector(_target, "chapter-unit").getAttribute('data-chapter-id');

        if (this.chapter.swapParagraphs(currentParagraphId, adjacentParagraphId)) {
            await documentFactory.updateDocument(currentSpaceId, this._document);
            this._document.notifyObservers(`${this._document.getNotificationId()}:document-view-page:chapter:${chapterId}`);
            webSkel.space.currentParagraphId = currentParagraphId;
        } else {
            console.error(`Unable to swap paragraphs. ${currentParagraphId}, ${adjacentParagraphId}, Chapter: ${chapterId}`);
        }
    }


}



