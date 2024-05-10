const {notificationService} = require("assistos").loadModule("util");
export class SpaceChapterUnit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this._document =  assistOS.space.getDocumentFromCache(window.location.hash.split("/")[3]);
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.refreshChapter = async () =>{
            this.chapter = await this._document.refreshChapter(this._document.id, this.chapter.id);
        };
        this.refreshChapterTitle = async () =>{
            await this.chapter.refreshChapterTitle(this._document.id, this.chapter.id);
        };
        this.refreshParagraph = (paragraphId) =>{
            return async ()=>{
                this.chapter = await this.chapter.refreshParagraph(this._document.id, paragraphId);
            };
        }

        this.addParagraphOnCtrlEnter = this.addParagraphOnCtrlEnter.bind(this);
        this.element.removeEventListener('keydown', this.addParagraphOnCtrlEnter);
        this.element.addEventListener('keydown', this.addParagraphOnCtrlEnter);
        this.subscribeToChapterEvents();
        this.invalidate();
    }
    beforeRender() {
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.chapterTitle=this.chapter.title;
        this.titleMetadata = this.element.variables["data-title-metadata"];
        this.chapterContent = "";
        if (this.chapter) {
            if (this.chapter.visibility === "hide") {
                if (this.element.querySelector(".chapter-paragraphs")) {
                    this.element.querySelector(".chapter-paragraphs").classList.add("hidden");
                }
            }
        }
        let iterator = 0;
        this.chapter.paragraphs.forEach((paragraph) => {
            iterator++;
            this.chapterContent += `<space-paragraph-unit data-paragraph-content="${paragraph.text}" data-metadata="paragraph nr. ${iterator} with id ${paragraph.id}" data-paragraph-id="${paragraph.id}"></space-paragraph-unit>`;
        });
    }
    subscribeToChapterEvents(){
        notificationService.on(this.chapter.id + "/title", ()=>{
            this.invalidate(this.refreshChapterTitle);
        });
        notificationService.on(this.chapter.id, ()=>{
            this.invalidate(this.refreshChapter);
        });

        for(let paragraph of this.chapter.paragraphs){
            notificationService.on(paragraph.id, ()=>{
                this.invalidate(this.refreshParagraph(paragraph.id));
            });
        }
    }
    afterRender() {

        this.chapterUnit = this.element.querySelector(".chapter-unit");
        let selectedParagraphs = this.element.querySelectorAll(".paragraph-text");
        let currentParagraph = "";
        for(let paragraph of selectedParagraphs){
            if (assistOS.UI.reverseQuerySelector(paragraph, '[data-paragraph-id]').getAttribute("data-paragraph-id") === assistOS.space.currentParagraphId) {
                currentParagraph = paragraph;
                currentParagraph.click();
                assistOS.UI.moveCursorToEnd(currentParagraph);
                //currentParagraph.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
                break;
            }
        }
        if (this.chapter.id === assistOS.space.currentChapterId && !currentParagraph) {
            this.chapterUnit.click();
            //this.element.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
        }
        if(this.chapter.visibility === "hide"){
            let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
            paragraphsContainer.classList.toggle('hidden');
            let arrow = this.element.querySelector(".arrow");
            arrow.classList.toggle('rotate');
        }
    }

    async addParagraphOnCtrlEnter(event) {
        if (!event.ctrlKey || event.key !== 'Enter') {
            return;
        }
        const fromParagraph = assistOS.UI.reverseQuerySelector(event.target, '[data-paragraph-id]','space-chapter-unit');
        const fromChapter = assistOS.UI.reverseQuerySelector(event.target, '.chapter-unit');

        if (!fromParagraph && !fromChapter) {
            return;
        }
        await assistOS.callFlow("AddParagraph", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: this.chapter.id
        });
    }
    highlightChapter(){
        this.deselectPreviousElements();
        this.chapterUnit.setAttribute("id", "highlighted-element");
        assistOS.space.currentChapterId = this.chapter.id;
        if(this._document.chapters.length===1){
            return;
        }
        let foundElement = this.chapterUnit.querySelector('.chapter-arrows');
        foundElement.style.display = "flex";
        let xMark = this.chapterUnit.querySelector('.delete-chapter');
        xMark.style.visibility = "visible";
    }
    async editChapterTitle(title) {
        this.deselectPreviousElements(title);
        title.setAttribute("contenteditable", "true");
        title.setAttribute("id", "highlighted-child-element");

        const titleEnterHandler = async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        };
        title.addEventListener('keydown', titleEnterHandler);
        title.focus();

        let timer = assistOS.services.SaveElementTimer(async () => {
            let titleText = assistOS.UI.sanitize(assistOS.UI.customTrim(title.innerText))
            if(!titleText){
                titleText = "";
            }
            if (titleText !== this.chapter.title && titleText !== "") {
                await assistOS.callFlow("UpdateChapterTitle", {
                    spaceId: assistOS.space.id,
                    documentId: this._document.id,
                    chapterId: this.chapter.id,
                    title: titleText
                });
            }
        }, 3000);
        /* NO chapter Title */
        /* constants for page names */
        /* save button hidden */
        title.addEventListener("focusout", async (event) => {
            title.innerText = assistOS.UI.customTrim(title.innerText)||assistOS.UI.unsanitize(this.chapter.title || "");
            await timer.stop(true);
            title.removeAttribute("contenteditable");
            let agentPage = document.getElementById("agent-page");
            if(event.relatedTarget){
                if((event.relatedTarget.getAttribute("id") !== "agent-page") && !agentPage.contains(event.relatedTarget)){
                    title.removeAttribute("id");
                }
            } else {
                title.removeAttribute("id");
            }
            title.removeEventListener('keydown', titleEnterHandler);
            title.removeEventListener("keydown", resetTimer);
        }, {once: true});
        const resetTimer = async () => {
            await timer.reset(1000);
        };
        title.addEventListener("keydown", resetTimer);
    }

    deselectPreviousElements(element){
        let previousHighlightedElement = document.querySelector("#highlighted-element");
        if(previousHighlightedElement && !previousHighlightedElement.contains(element)){
            previousHighlightedElement.removeAttribute("id");
        }
        let previousHighlightedChildElement = document.querySelector("#highlighted-child-element");
        if(previousHighlightedChildElement){
            previousHighlightedChildElement.removeAttribute("id");
        }
    }
    changeChapterDisplay(_target) {
        this.chapter.visibility === "hide" ? this.chapter.visibility = "show" : this.chapter.visibility = "hide";
        let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
        paragraphsContainer.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }
}



