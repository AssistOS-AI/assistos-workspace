import {customTrim, parseURL, reverseQuerySelector, sanitize,unsanitize, SaveElementTimer,moveCursorToEnd} from "../../../../imports.js";

export class chapterUnit {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.currentUser.space.getDocument(parseURL());
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page:" + "chapter:" + `${chapterId}`, invalidate);
        this.invalidate = invalidate;
        this.invalidate();
        this.addParagraphOnCtrlEnter = this.addParagraphOnCtrlEnter.bind(this);
        this.element.removeEventListener('keydown', this.addParagraphOnCtrlEnter);
        this.element.addEventListener('keydown', this.addParagraphOnCtrlEnter);
    }

    beforeRender() {
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.chapterTitle=this.chapter.title;
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
        this.chapterUnit = this.element.querySelector(".chapter-unit");
        let selectedParagraphs = this.element.querySelectorAll(".paragraph-text");
        let currentParagraph = "";
        selectedParagraphs.forEach(paragraph => {
            if (reverseQuerySelector(paragraph, '[data-paragraph-id]').getAttribute("data-paragraph-id") === webSkel.currentUser.space.currentParagraphId) {
                currentParagraph = paragraph;
                currentParagraph.click();
                moveCursorToEnd(currentParagraph);
                this.switchParagraphArrows(currentParagraph, "on");
                currentParagraph.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
            }
        });
        if (this.chapter.id === webSkel.currentUser.space.currentChapterId) {
            this.chapterUnit.click();
            this.element.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
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
        const fromParagraph = reverseQuerySelector(event.target, '[data-paragraph-id]','chapter-unit');
        const fromChapter = reverseQuerySelector(event.target, '.chapter-unit');

        if (!fromParagraph && !fromChapter) {
            return;
        }
        let flowId = webSkel.currentUser.space.getFlowIdByName("AddParagraph");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this.chapter.id);
        this.invalidate();
    }

    switchParagraphArrows(target, mode) {
        if(this.chapter.paragraphs.length <= 1){
            return;
        }
        let foundElement = target.querySelector('.paragraph-arrows');
        if (!foundElement) {
            let nextSibling = target.nextElementSibling;
            while (nextSibling) {
                if (nextSibling.matches('.paragraph-arrows')) {
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

    async editChapterTitle(title) {
        title.setAttribute("contenteditable", "true");

        const titleEnterHandler = async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        };
        title.addEventListener('keydown', titleEnterHandler);
        title.focus();

        let timer = new SaveElementTimer(async () => {
            let titleText = sanitize(customTrim(title.innerText))
            if (titleText !== this.chapter.title && titleText !== "") {
                await this._document.updateChapterTitle(this.chapter, titleText);
            }
        }, 3000);

        title.addEventListener("blur", async () => {
            title.innerText = customTrim(title.innerText)||unsanitize(this.chapter.title);
            await timer.stop(true);
            title.removeAttribute("contenteditable");
            title.removeEventListener('keydown', titleEnterHandler);
            title.removeEventListener("keydown", resetTimer);
        }, {once: true});
        const resetTimer = async () => {
            await timer.reset(1000);
        };
        title.addEventListener("keydown", resetTimer);
    }
    editParagraph(paragraph) {
        if (paragraph.getAttribute("contenteditable") === "false") {

            paragraph.setAttribute("contenteditable", "true");
            let paragraphUnit = reverseQuerySelector(paragraph, ".paragraph-unit");
            paragraph.focus();

            let currentParagraphId = paragraphUnit.getAttribute("data-paragraph-id");
            webSkel.currentUser.space.currentParagraphId = currentParagraphId;
            let currentParagraph = this.chapter.getParagraph(currentParagraphId);
            let timer = new SaveElementTimer(async () => {
                if (!currentParagraph) {
                    await timer.stop();
                    return;
                }
                let paragraphText = sanitize(customTrim(paragraph.innerText));
                if (paragraphText !== currentParagraph.text) {
                    let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateParagraphText");
                    await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this.chapter.id, currentParagraph.id, paragraphText);
                }
            }, 1000);
            paragraph.addEventListener("blur", async () => {
                paragraph.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                paragraph.setAttribute("contenteditable", "false");
                webSkel.currentUser.space.currentParagraph = null;
            }, {once: true});
            let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteParagraph");
            const resetTimer = async (event) => {
                if (paragraph.innerText.trim() === "" && event.key === "Backspace") {
                    if (currentParagraph) {
                        let curentParagraphIndex = this.chapter.getParagraphIndex(currentParagraphId);
                        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this.chapter.id, currentParagraphId);
                        if(this.chapter.paragraphs.length>0) {
                            if (curentParagraphIndex === 0) {
                                webSkel.currentUser.space.currentParagraphId = this.chapter.paragraphs[0].id;
                            }else{
                                webSkel.currentUser.space.currentParagraphId = this.chapter.paragraphs[curentParagraphIndex-1].id;
                            }
                        }else{
                            webSkel.currentUser.space.currentParagraphId = null;
                        }
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

    highlightChapter(){
        this.chapterUnit.setAttribute("id", "highlighted-chapter");
        webSkel.currentUser.space.currentChapterId = this.chapter.id;
        if(this._document.chapters.length===1){
            return;
        }
        let foundElement = this.chapterUnit.querySelector('.chapter-arrows');
        foundElement.style.display = "flex";

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

        let flowId = webSkel.currentUser.space.getFlowIdByName("SwapChapters");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, currentChapterId, adjacentChapterId);
        this._document.notifyObservers(`${this._document.getNotificationId()}:refresh`);
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
            await documentFactory.updateDocument(webSkel.currentUser.space.id, this._document);
            webSkel.currentUser.space.currentParagraphId = currentParagraphId;
            debugger;
            this.invalidate();

        } else {
            console.error(`Unable to swap paragraphs. ${currentParagraphId}, ${adjacentParagraphId}, Chapter: ${chapterId}`);
        }
    }
}



