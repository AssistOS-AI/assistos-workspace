const {notificationService} = require("assistos").loadModule("util", {});

export class SpaceChapterUnit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this._document = document.querySelector("space-document-view-page").webSkelPresenter._document;
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.refreshChapter = async () => {
            this.chapter = await this._document.refreshChapter(this._document.id, this.chapter.id);
        };
        this.refreshChapterTitle = async () => {
            await this.chapter.refreshChapterTitle(assistOS.space.id, this._document.id, this.chapter.id);
        };
        this.refreshParagraph = (paragraphId) => {
            return async () => {
                await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, paragraphId);
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
        this.chapterTitle = this.chapter.title;
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
            if(paragraph.image){
                this.chapterContent += `<image-paragraph data-presenter="image-paragraph" data-metadata="paragraph nr. ${iterator} with id ${paragraph.id}" data-paragraph-id="${paragraph.id}" data-chapter-id="${this.chapter.id}"></image-paragraph>`
            } else {
                this.chapterContent += `<space-paragraph-unit data-presenter="space-paragraph-unit" data-metadata="paragraph nr. ${iterator} with id ${paragraph.id}" data-paragraph-id="${paragraph.id}" data-chapter-id="${this.chapter.id}"></space-paragraph-unit>`;
            }
        });
    }

    subscribeToChapterEvents() {
        notificationService.on(this.chapter.id + "/title", () => {
            this.invalidate(this.refreshChapterTitle);
        });
        notificationService.on(this.chapter.id, () => {
            this.invalidate(this.refreshChapter);
        });
    }

    afterRender() {
        this.chapterUnit = this.element.querySelector(".chapter-unit");
        if (this.chapter.id === assistOS.space.currentChapterId && !assistOS.space.currentParagraphId) {
            this.chapterUnit.click();
            //this.element.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
        }
        if (this.chapter.visibility === "hide") {
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
        const fromParagraph = assistOS.UI.reverseQuerySelector(event.target, '[data-paragraph-id]', 'space-chapter-unit');
        const fromChapter = assistOS.UI.reverseQuerySelector(event.target, '.chapter-unit');

        if (!fromParagraph && !fromChapter) {
            return;
        }
        let position = this.chapter.paragraphs.length;
        if (assistOS.space.currentParagraphId) {
            position = this.chapter.getParagraphIndex(assistOS.space.currentParagraphId) + 1;
        }
        assistOS.space.currentParagraphId = await assistOS.callFlow("AddParagraph", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: this.chapter.id,
            position: position
        });
    }

    highlightChapter(_target) {
        this.deselectPreviousElements();
        this.chapterUnit.setAttribute("id", "highlighted-element");
        assistOS.space.currentChapterId = this.chapter.id;
        this.switchButtonsDisplay(this.chapterUnit, "on");
        let paragraphs = this.element.querySelectorAll(".paragraph-text");
        let agentPage = document.getElementById("agent-page");
        for(let paragraph of paragraphs) {
            paragraph.classList.add("unfocused");
        }
        this.chapterUnit.addEventListener("focusout", (event) => {
            if(event.relatedTarget){
                let chapterUnit = event.relatedTarget.closest("space-chapter-unit");
                if((!chapterUnit || event.relatedTarget.getAttribute("data-chapter-id") !== this.chapter.id) && (event.relatedTarget.getAttribute("id") !== "agent-page") && !agentPage.contains(event.relatedTarget)){
                    this.switchParagraphsBackground("white");
                    this.switchButtonsDisplay(this.chapterUnit, "off");
                }

            } else {
                this.switchParagraphsBackground("white");
                this.switchButtonsDisplay(this.chapterUnit, "off");
            }
        }, {once: true});
    }
    switchButtonsDisplay(target, mode) {
        let xMark = this.chapterUnit.querySelector('.delete-chapter');
        mode === "on" ? xMark.style.visibility = "visible" : xMark.style.visibility = "hidden";
        if (this._document.chapters.length <= 1) {
            return;
        }
        let foundElement = target.querySelector(".chapter-arrows");
        if (!foundElement) {
            let nextSibling = target.nextElementSibling;
            while (nextSibling) {
                if (nextSibling.matches(".chapter-arrows")) {
                    foundElement = nextSibling;
                    break;
                }
                nextSibling = nextSibling.nextElementSibling;
            }
        }
        if (mode === "on") {
            foundElement.style.display = "flex";
        } else {
            foundElement.style.display = "none";
        }
    }
    switchParagraphsBackground(mode){
        let paragraphs = this.element.querySelectorAll(".paragraph-text");
        if(mode === "white"){
            for(let paragraph of paragraphs){
                paragraph.classList.remove("unfocused");
            }
        } else {
            for(let paragraph of paragraphs){
                paragraph.classList.add("unfocused");
            }
        }
    }
    async editChapterTitle(title) {
        this.highlightChapter();
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
        this.switchParagraphsBackground("blue");
        this.switchButtonsDisplay(this.chapterUnit, "on");
        let timer = assistOS.services.SaveElementTimer(async () => {
            let titleText = assistOS.UI.sanitize(assistOS.UI.customTrim(title.innerText))
            if (!titleText) {
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
            title.innerText = assistOS.UI.customTrim(title.innerText) || assistOS.UI.unsanitize(this.chapter.title || "");
            await timer.stop(true);
            title.removeAttribute("contenteditable");
            let agentPage = document.getElementById("agent-page");
            if (event.relatedTarget) {
                if ((event.relatedTarget.getAttribute("id") !== "agent-page") && !agentPage.contains(event.relatedTarget)) {
                    this.switchParagraphsBackground("white");
                    title.removeAttribute("id");
                    this.switchButtonsDisplay(this.chapterUnit, "off");
                }
            } else {
                this.switchParagraphsBackground("white");
                title.removeAttribute("id");
                this.switchButtonsDisplay(this.chapterUnit, "off");
            }
            title.removeEventListener('keydown', titleEnterHandler);
            title.removeEventListener("keydown", resetTimer);
        }, {once: true});
        const resetTimer = async () => {
            await timer.reset(1000);
        };
        title.addEventListener("keydown", resetTimer);
    }

    deselectPreviousElements(element) {
        let previousHighlightedElement = document.querySelector("#highlighted-element");
        if (previousHighlightedElement && !previousHighlightedElement.contains(element)) {
            previousHighlightedElement.removeAttribute("id");
        }
        let previousHighlightedChildElement = document.querySelector("#highlighted-child-element");
        if (previousHighlightedChildElement) {
            previousHighlightedChildElement.removeAttribute("id");
        }
    }

    changeChapterDisplay(_target) {
        this.highlightChapter(_target);
        this.chapter.visibility === "hide" ? this.chapter.visibility = "show" : this.chapter.visibility = "hide";
        let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
        paragraphsContainer.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }
}



