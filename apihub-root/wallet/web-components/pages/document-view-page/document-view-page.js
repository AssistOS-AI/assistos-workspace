import {getClosestParentElement, parseURL, reverseQuerySelector, SaveElementTimer} from "../../../imports.js";

export class documentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.space.getDocument(parseURL());
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page", invalidate);
        this._document.observeChange(this._document.getNotificationId() + ":refresh", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.chaptersContainer = "";
        this.docTitle = this._document.title;
        this.abstractText=this._document.abstract||"No abstract has been set or generated for this document";
        if(this._document.chapters.length > 0) {
            this._document.setCurrentChapter(this._document.chapters[0].id);
            let iterator = 0;
            this._document.chapters.forEach((item) => {
                iterator++;
                this.chaptersContainer += `<chapter-unit data-chapter-number="${iterator}" data-chapter-title="${item.title}" data-chapter-id="${item.id}" data-presenter="chapter-unit"></chapter-unit>`;
            });
        }
        document.removeEventListener("click",this.highlightElement);
    }

    afterRender() {
        this.chapterSidebar = this.element.querySelector("#chapter-sidebar");
        this.paragraphSidebar = this.element.querySelector("#paragraph-sidebar");
        let controller = new AbortController();
        document.addEventListener("click",this.highlightElement.bind(this, controller), {signal:controller.signal});
    }

    highlightElement(controller, event){
        this.chapterUnit = getClosestParentElement(event.target, ".chapter-unit");
        this.paragraphUnit = getClosestParentElement(event.target, "paragraph-unit");
        this.deselectPreviousParagraph();
        this.deselectPreviousChapter();
        if(this.paragraphUnit){
            this.previouslySelectedParagraph = this.paragraphUnit;
            this.previouslySelectedChapter = this.chapterUnit;
            this.displaySidebar("paragraph-sidebar");
            webSkel.space.currentParagraphId = this.paragraphUnit.getAttribute("data-paragraph-id");
            this.switchArrowsDisplay(this.paragraphUnit, "paragraph", "on");
            this.highlightChapter();
        }else if(this.chapterUnit){
            this.displaySidebar("chapter-sidebar");
            this.previouslySelectedChapter = this.chapterUnit;
            this.switchArrowsDisplay(this.chapterUnit, "chapter", "on");
            this.highlightChapter();
        }else {
            let rightSideBarItem = getClosestParentElement(event.target, ".sidebar-item");
            let leftSideBarItem = getClosestParentElement(event.target, ".feature");
            if(rightSideBarItem || leftSideBarItem){
                controller.abort();
            }else {
                this.displaySidebar("document-sidebar");
            }
        }
    }

    deselectPreviousParagraph(){
        if(this.previouslySelectedParagraph){
            webSkel.space.currentParagraphId = null;
            this.switchArrowsDisplay(this.previouslySelectedParagraph, "paragraph");
            delete this.previouslySelectedParagraph;
        }
    }

    deselectPreviousChapter(){
        if(this.previouslySelectedChapter){
            this.switchArrowsDisplay(this.previouslySelectedChapter, "chapter");
            this.previouslySelectedChapter.removeAttribute("id");
            webSkel.space.currentChapterId = null;
            delete this.previouslySelectedChapter;
        }
    }
    highlightChapter(){
        this.chapterUnit.setAttribute("id", "highlighted-chapter");
        this.switchArrowsDisplay(this.chapterUnit, "chapter", "on");
        webSkel.space.currentChapterId = this.chapterUnit.getAttribute("data-chapter-id");
    }

    switchArrowsDisplay(target, type, mode) {
        if(type==="chapter"){
            if(this._document.chapters.length===1){
                return;
            }
        }
        if(type==="paragraph"){
            let chapter = this._document.getChapter(this.previouslySelectedChapter.getAttribute("data-chapter-id"));
            if(chapter.paragraphs.length===1){
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
        if(mode === "on"){
            foundElement.style.display = "flex";
        }else{
            foundElement.style.display = "none";
        }
    }

    displaySidebar(sidebarID) {
        setTimeout(()=>{
            if(sidebarID === "paragraph-sidebar"){
                this.chapterSidebar.style.display = "block";
                this.paragraphSidebar.style.display = "block";}
            else if(sidebarID === "chapter-sidebar")
            {
                this.chapterSidebar.style.display = "block";
                this.paragraphSidebar.style.display = "none";
            }
            else {
                this.chapterSidebar.style.display = "none";
                this.paragraphSidebar.style.display = "none";
            }
        },100);
    }
    async editAbstract(abstract){
        if (abstract.getAttribute("contenteditable") === "false") {
            let abstractSection = reverseQuerySelector(abstract,".abstract-section");
            abstract.setAttribute("contenteditable", "true");
            abstract.focus();
            abstractSection.setAttribute("id", "highlighted-chapter");
            let timer = new SaveElementTimer(async () => {
                if (abstract.innerText !== this._document.abstract) {
                    await this._document.updateAbstract(abstract.innerText);
                }
            }, 1000);
            abstract.addEventListener("blur", async () => {
                abstract.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                abstract.setAttribute("contenteditable", "false");
                abstractSection.removeAttribute("id");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            abstract.addEventListener("keydown", resetTimer);
        }
    }
    async addChapter() {
        let chapterData= {
            title: "New Chapter",
            id: webSkel.getService("UtilsService").generateId(),
            paragraphs: [
                {
                    text: "New Paragraph",
                    id: webSkel.getService("UtilsService").generateId()
                }
            ]
        }
        let position = this._document.chapters.length;
        if(webSkel.space.currentChapterId){
            position = this._document.chapters.findIndex(chapter => chapter.id === webSkel.space.currentChapterId) + 1;
        }
        await this._document.addChapter(chapterData, position);
        webSkel.space.currentChapterId = chapterData.id;
        webSkel.space.currentParagraphId = chapterData.paragraphs[0].id;
        this.invalidate();
    }
    async addParagraph(_target){
        let chapter = this._document.getChapter(webSkel.space.currentChapterId);
        let newParagraphId= webSkel.getService("UtilsService").generateId();
        let position = chapter.paragraphs.length;
        if(webSkel.space.currentParagraphId){
            position = chapter.getParagraphIndex(webSkel.space.currentParagraphId) + 1;
        }
        await this._document.addParagraph(chapter, {id: newParagraphId, text:""}, position);
        webSkel.space.currentParagraphId = newParagraphId;
        webSkel.space.currentChapterId = chapter.id;
        this._document.notifyObservers(this._document.getNotificationId() + ":document-view-page:" + "chapter:" + `${chapter.id}`);
        let controller = new AbortController();
        document.addEventListener("click",this.highlightElement.bind(this, controller), {signal:controller.signal});
    }



    editTitle(title){
        if (title.getAttribute("contenteditable") === "false") {
            title.setAttribute("contenteditable", "true");
            title.focus();
            title.parentElement.setAttribute("id", "highlighted-chapter");
            let timer = new SaveElementTimer(async () => {
                if (title.innerText !== this._document.title) {
                    await this._document.updateTitle(title.innerText);
                }
            }, 1000);
            title.addEventListener("blur", async () => {
                title.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                title.setAttribute("contenteditable", "false");
                title.parentElement.removeAttribute("id");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            title.addEventListener("keydown", resetTimer);
        }
    }

    async openEditTitlePage() {
        await webSkel.changeToDynamicPage("edit-title-page", `documents/${this._document.id}/edit-title-page`);
    }

    async openEditAbstractPage() {
        await webSkel.changeToDynamicPage("edit-abstract-page", `documents/${this._document.id}/edit-abstract-page`);
    }

    async openDocumentSettingsPage() {
        await webSkel.changeToDynamicPage("document-settings-page", `documents/${this._document.id}/document-settings-page`);
    }

    async openManageChaptersPage() {
        await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this._document.id}/manage-chapters-page`);
    }

    async openChapterBrainstormingPage() {
        await webSkel.changeToDynamicPage("chapter-brainstorming-page",
            `documents/${this._document.id}/chapter-brainstorming-page/${webSkel.space.currentChapterId}`);

    }

    async openManageParagraphsPage() {
        await webSkel.changeToDynamicPage("manage-paragraphs-page",
            `documents/${this._document.id}/manage-paragraphs-page/${webSkel.space.currentChapterId}`);
    }

    async openParagraphProofreadPage() {
        await webSkel.changeToDynamicPage("paragraph-proofread-page",
            `documents/${this._document.id}/paragraph-proofread-page/${webSkel.space.currentChapterId}/${webSkel.space.currentParagraphId}`);
    }

    async openParagraphBrainstormingPage() {
        await webSkel.changeToDynamicPage("paragraph-brainstorming-page",
            `documents/${this._document.id}/paragraph-brainstorming-page/${webSkel.space.currentChapterId}/${webSkel.space.currentParagraphId}`);
    }
    async openEditChapterTitlePage() {
        await webSkel.changeToDynamicPage("chapter-title-page",
            `documents/${this._document.id}/chapter-title-page/${webSkel.space.currentChapterId}`);
    }
    async openDocumentViewPage(){
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }
    async openChapterEditor(){
        await webSkel.changeToDynamicPage("chapter-editor-page", `documents/${this._document.id}/chapter-editor-page/${webSkel.space.currentChapterId}`);
    }
}