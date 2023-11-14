import {
    getClosestParentElement,
    parseURL,
    reverseQuerySelector,
    SaveElementTimer,
} from "../../../imports.js";
export class chapterEditorPage{
    constructor(element, invalidate) {
        this.element = element;
        let documentId, chapterId;
        [documentId, chapterId] = parseURL();
        webSkel.currentUser.space.currentDocumentId = documentId;
        webSkel.currentUser.space.currentChapterId = chapterId;
        this._document = webSkel.currentUser.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this.element.addEventListener('keydown', (event) => this.addParagraphOnCtrlEnter(event));
        let controller = new AbortController();
        document.addEventListener("click",this.checkParagraphClick.bind(this, controller), {signal:controller.signal});

        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.chapterTitle= this._chapter.title;
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
        this.chapterId= this._chapter.id;
        this.chapterContent = "";
        this._chapter.paragraphs.forEach((paragraph) => {
            this.chapterContent += `<paragraph-unit data-paragraph-content="${paragraph.text}" data-paragraph-id="${paragraph.id}"></paragraph-unit>`;
        });

    }

    afterRender() {
        let selectedParagraphs = this.element.querySelectorAll(".paragraph-text");
        let currentParagraph = null;
        selectedParagraphs.forEach(paragraph => {
            if (reverseQuerySelector(paragraph, '[data-paragraph-id]').getAttribute("data-paragraph-id") === webSkel.currentUser.space.currentParagraphId) {
                this.currentParagraph = paragraph;
            }
        });
        if(this.currentParagraph){
            this.currentParagraph.click();
            this.currentParagraph.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
        }
    }
    async editChapterTitle(title){
        title.setAttribute("contenteditable", "true");
        title.focus();
        let timer = new SaveElementTimer(async () => {
            if (title.innerText !== this._chapter.title) {
                await this._document.updateChapterTitle(this._chapter, title.innerText);
            }
        }, 1000);
        title.addEventListener("blur", async () => {
            title.removeEventListener("keydown", resetTimer);
            await timer.stop(true);
            title.setAttribute("contenteditable", "false");
        }, {once: true});
        const resetTimer = async () => {
            await timer.reset(1000);
        };
        title.addEventListener("keydown", resetTimer);

    }
    checkParagraphClick(controller,event){
        this.paragraphUnit = getClosestParentElement(event.target, "paragraph-unit");
        if(this.paragraphUnit){
            if(this.currentParagraph!==this.paragraphUnit) {
                this.deselectPreviousParagraph();
                this.currentParagraph = this.paragraphUnit;
                webSkel.currentUser.space.currentParagraphId = this.paragraphUnit.getAttribute("data-paragraph-id");
                this.switchParagraphArrowsDisplay(this.paragraphUnit, "on");
            }
        } else {
            let rightSideBarItem = getClosestParentElement(event.target, ".sidebar-item");
            let leftSideBarItem = getClosestParentElement(event.target, ".feature");
            if(rightSideBarItem || leftSideBarItem){
                  controller.abort();
              }
              else{
                  this.deselectPreviousParagraph();
              }
        }
    }
    async addParagraphOnCtrlEnter(event) {
        if (!event.ctrlKey || event.key !== 'Enter') {
            return;
        }
        debugger;
        const fromParagraph = reverseQuerySelector(event.target, '[data-paragraph-id]', 'chapter-unit');
        const fromChapter = reverseQuerySelector(event.target, 'chapter-editor-page');

        if (!fromParagraph && !fromChapter) {
            return;
        }
        await this.addParagraph(event.target);
    }
    async addParagraph(_target){
        let chapter = this._document.getChapter(this.chapterId);
        let newParagraphId= webSkel.getService("UtilsService").generateId();
        let position = chapter.paragraphs.length;
        debugger;
        if(webSkel.currentUser.space.currentParagraphId){
            position = chapter.getParagraphIndex(webSkel.currentUser.space.currentParagraphId) + 1;
        }
        await this._document.addParagraph(chapter, {id: newParagraphId, text:""}, position);
        webSkel.currentUser.space.currentParagraphId = newParagraphId;
        let controller = new AbortController();
        document.addEventListener("click",this.checkParagraphClick.bind(this, controller), {signal:controller.signal});
        this.invalidate();
    }
    switchParagraphArrowsDisplay(target, mode) {
        let chapter = this._document.getChapter(this.chapterId);
        if(chapter.paragraphs.length===1){
            return;
        }
        const arrowsSelector ='.paragraph-arrows';
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

    editParagraph(paragraph) {
        if(this.currentParagraph){
            this.switchParagraphArrowsDisplay(this.currentParagraph,"off");
            delete this.currentParagraph;
        }
        this.switchParagraphArrowsDisplay(paragraph,"on");
        if (paragraph.getAttribute("contenteditable") === "false") {
            paragraph.setAttribute("contenteditable", "true");
            let paragraphUnit = reverseQuerySelector(paragraph, ".paragraph-unit");
            paragraph.focus();
            this.currentParagraph=paragraph;
            let currentParagraphId = paragraphUnit.getAttribute("data-paragraph-id");
            webSkel.currentUser.space.currentParagraphId = currentParagraphId;
            let currentParagraph = this._chapter.getParagraph(currentParagraphId);
            let timer = new SaveElementTimer(async () => {
                if (!currentParagraph) {
                    await timer.stop();
                    return;
                }
                let updatedText = paragraph.innerText;
                if (updatedText !== currentParagraph.text) {
                    await this._document.updateParagraphText(currentParagraph, updatedText);
                }
            }, 1000);
            paragraph.addEventListener("blur", async () => {
                paragraph.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                paragraph.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async (event) => {
                if (paragraph.innerText.trim() === "" && event.key === "Backspace") {
                    if (currentParagraph) {
                        await this._document.deleteParagraph(this._chapter, currentParagraphId);
                        this.invalidate();
                    }
                    await timer.stop();
                } else {
                    await timer.reset(1000);
                }
            };
            paragraph.addEventListener("keydown", resetTimer);
        }
    }
    deselectPreviousParagraph(){
        if(this.currentParagraph){
            webSkel.currentUser.space.currentParagraphId = null;
            this.switchParagraphArrowsDisplay(this.currentParagraph, "off");
            delete this.currentParagraph;
        }
    }
    async moveParagraph(_target, direction) {
        this.switchParagraphArrowsDisplay(this.currentParagraph,"off");
        const currentParagraph = reverseQuerySelector(_target, "paragraph-unit");
        const currentParagraphId = currentParagraph.getAttribute('data-paragraph-id');
        const currentParagraphIndex = this._chapter.getParagraphIndex(currentParagraphId);

        const getAdjacentParagraphId = (index, paragraphs) => {
            if (direction === "up") {
                return index === 0 ? paragraphs[paragraphs.length - 1].id : paragraphs[index - 1].id;
            }
            return index === paragraphs.length - 1 ? paragraphs[0].id : paragraphs[index + 1].id;
        };

        const adjacentParagraphId = getAdjacentParagraphId(currentParagraphIndex, this._chapter.paragraphs);
        const chapterId = this.chapterId;

        if (this._chapter.swapParagraphs(currentParagraphId, adjacentParagraphId)) {
            await documentFactory.updateDocument(webSkel.currentUser.space.id, this._document);
            this.invalidate();
            webSkel.currentUser.space.currentParagraphId = currentParagraphId;
        } else {
            console.error(`Unable to swap paragraphs. ${currentParagraphId}, ${adjacentParagraphId}, Chapter: ${chapterId}`);
        }
    }
    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async openChapterEditPage(){
        await webSkel.changeToDynamicPage("chapter-edit-page", `documents/${this._document.id}/chapter-edit-page/${this._chapter.id}`);
    }
    async openChapterEditor(){
        await webSkel.changeToDynamicPage("chapter-editor-page", `documents/${this._document.id}/chapter-editor-page/${this.chapterId}`);
    }
    async openEditChapterTitlePage() {
        await webSkel.changeToDynamicPage("chapter-title-page",
            `documents/${this._document.id}/chapter-title-page/${this.chapterId}`);
    }
    async openChapterBrainstormingPage() {
        await webSkel.changeToDynamicPage("chapter-brainstorming-page",
            `documents/${this._document.id}/chapter-brainstorming-page/${this.chapterId}`);

    }
    async openManageParagraphsPage() {
        await webSkel.changeToDynamicPage("manage-paragraphs-page",
            `documents/${this._document.id}/manage-paragraphs-page/${this.chapterId}`);
    }
    async generateParagraphs(){
        await webSkel.changeToDynamicPage("generate-paragraphs-page", `documents/${this._document.id}/generate-paragraphs-page/${this._chapter.id}`);
    }
}