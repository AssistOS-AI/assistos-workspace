import {parseURL, reverseQuerySelector, SaveElementTimer} from "../../../../imports.js";
export class chapterEditorUnit{
    constructor(element, invalidate) {
        this.element = element;
        [this.documentId,this.chapterId]=parseURL();
        this._document = webSkel.space.getDocument(this.documentId);
        this.chapter=this._document.getChapter(this.chapterId);
        this._document.observeChange(this._document.getNotificationId() + ":chapter-editor-page:" + "chapter:" + `${this.chapterId}`, invalidate);
        this.invalidate = invalidate;
        this.invalidate();
        this.addParagraphOnCtrlEnter = this.addParagraphOnCtrlEnter.bind(this);
        this.element.removeEventListener('keydown', this.addParagraphOnCtrlEnter);
        this.element.addEventListener('keydown', this.addParagraphOnCtrlEnter);
    }

    beforeRender() {
        this.chapterContent = "";
        this.chapter.paragraphs.forEach((paragraph) => {
            this.chapterContent += `<paragraph-unit data-paragraph-content="${paragraph.text}" data-paragraph-id="${paragraph.id}"></paragraph-unit>`;
        });
    }

    afterRender() {
        let selectedParagraphs = this.element.querySelectorAll(".paragraph-text");
        let currentParagraph = null;
        selectedParagraphs.forEach(paragraph => {
            if (reverseQuerySelector(paragraph, '[data-paragraph-id]').getAttribute("data-paragraph-id") === webSkel.space.currentParagraphId) {
                currentParagraph = paragraph;
            }
        });
        if(currentParagraph){
            currentParagraph.click();
            currentParagraph.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
        }
    }
    switchParagraphArrowsDisplay(target, mode) {
        let chapter = this._document.getChapter(this.element.getAttribute("data-chapter-id"));
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
    async addParagraphOnCtrlEnter(event) {
        if (!event.ctrlKey || event.key !== 'Enter') {
            return;
        }
        debugger;
        const fromParagraph = reverseQuerySelector(event.target, '[data-paragraph-id]','chapter-unit');
        const fromChapter = reverseQuerySelector(event.target, 'chapter-editor-unit');

        if (!fromParagraph && !fromChapter) {
            return;
        }
        let paragraphPosition=null;
        if(fromParagraph){
            paragraphPosition=this.chapter.getParagraphIndex(fromParagraph.getAttribute("data-paragraph-id"))+1;
        }else{
            paragraphPosition=this.chapter.paragraphs.length;
        }
        await this.addNewParagraph(paragraphPosition);
    }

    async addNewParagraph(paragraphPosition){
        let newParagraphId=webSkel.getService("UtilsService").generateId();
        await this._document.addParagraph(this.chapter, {id: newParagraphId, text:""}, paragraphPosition);
        webSkel.space.currentChapterId=this.chapter.id;
        webSkel.space.currentParagraphId=newParagraphId;
        this.invalidate();
    }

    async editChapterTitle(title){
        title.setAttribute("contenteditable", "true");
        title.focus();
        let timer = new SaveElementTimer(async () => {
            if (title.innerText !== this.chapter.title) {
                await this._document.updateChapterTitle(this.chapter, title.innerText);
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

    editParagraph(paragraph) {
        this.switchParagraphArrowsDisplay(paragraph,"on");
        if (paragraph.getAttribute("contenteditable") === "false") {
            paragraph.setAttribute("contenteditable", "true");
            let paragraphUnit = reverseQuerySelector(paragraph, ".paragraph-unit");
            paragraph.focus();

            let currentParagraphId = paragraphUnit.getAttribute("data-paragraph-id");
            webSkel.space.currentParagraphId = currentParagraphId;
            let currentParagraph = this.chapter.getParagraph(currentParagraphId);
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
                webSkel.space.currentParagraphId = null;
            }, {once: true});
            const resetTimer = async (event) => {
                if (paragraph.innerText.trim() === "" && event.key === "Backspace") {
                    if (currentParagraph) {
                        await this._document.deleteParagraph(this.chapter, currentParagraphId);
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

    async moveParagraph(_target, direction) {
        debugger;
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
        const chapterId = reverseQuerySelector(_target, "chapter-editor-unit").getAttribute('data-chapter-id');

        if (this.chapter.swapParagraphs(currentParagraphId, adjacentParagraphId)) {
            await documentFactory.updateDocument(currentSpaceId, this._document);
            this.invalidate();
            webSkel.space.currentParagraphId = currentParagraphId;
        } else {
            console.error(`Unable to swap paragraphs. ${currentParagraphId}, ${adjacentParagraphId}, Chapter: ${chapterId}`);
        }
    }
}