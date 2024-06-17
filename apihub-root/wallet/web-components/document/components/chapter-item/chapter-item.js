import {unescapeHtmlEntities} from "../../../../imports.js";

const documentModule = require("assistos").loadModule("document", {});
const {notificationService} = require("assistos").loadModule("util", {});

export class ChapterItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this._document = this.documentPresenter._document;
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.refreshChapter = async () => {
            this.chapter = await this._document.refreshChapter(this._document.id, this.chapter.id);
        };
        this.addParagraphOnCtrlEnter = this.addParagraphOnCtrlEnter.bind(this);
        this.element.removeEventListener('keydown', this.addParagraphOnCtrlEnter);
        this.element.addEventListener('keydown', this.addParagraphOnCtrlEnter);
        this.subscribeToChapterEvents();
        this.invalidate();
    }

    beforeRender() {
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
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
                this.chapterContent += `<paragraph-item data-presenter="paragraph-item" data-metadata="paragraph nr. ${iterator} with id ${paragraph.id}" data-paragraph-id="${paragraph.id}" data-chapter-id="${this.chapter.id}"></paragraph-item>`;
            }
        });
    }

    subscribeToChapterEvents() {
        notificationService.on(this.chapter.id + "/title", async () => {
            let title = await documentModule.getChapterTitle(assistOS.space.id, this._document.id, this.chapter.id);
            if(title !== this.chapter.title){
                this.chapter.title = title;
                this.renderChapterTitle();
            }
        });
        notificationService.on(this.chapter.id, () => {
            this.invalidate(this.refreshChapter);
        });
    }
    async saveTitle(titleElement) {
        let titleText = assistOS.UI.sanitize(titleElement.value);
        if (titleText !== this.chapter.title && titleText !== "") {
            await assistOS.callFlow("UpdateChapterTitle", {
                spaceId: assistOS.space.id,
                documentId: this._document.id,
                chapterId: this.chapter.id,
                title: titleText
            });
        }
    }
    renderChapterTitle(){
        let chapterTitle = this.element.querySelector(".chapter-title");
        chapterTitle.value = unescapeHtmlEntities(this.chapter.title);
    }
    afterRender() {
        this.renderChapterTitle();
        this.chapterItem = this.element.querySelector(".chapter-item");
        if (this.chapter.id === assistOS.space.currentChapterId && !assistOS.space.currentParagraphId) {
            this.chapterItem.click();
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
        await this.documentPresenter.stopTimer(true);
        const fromParagraph = assistOS.UI.reverseQuerySelector(event.target, '[data-paragraph-id]', 'space-chapter-item');
        const fromChapter = assistOS.UI.reverseQuerySelector(event.target, '.chapter-item');

        if (!fromParagraph && !fromChapter) {
            return;
        }
        let position = this.chapter.paragraphs.length;
        if (assistOS.space.currentParagraphId) {
            position = this.chapter.getParagraphIndex(assistOS.space.currentParagraphId) + 1;
        }
        assistOS.space.currentParagraphId = (await assistOS.callFlow("AddParagraph", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: this.chapter.id,
            position: position
        })).data;
    }

    async highlightChapter(_target) {
        assistOS.space.currentChapterId = this.chapter.id;
        this.switchButtonsDisplay(this.chapterItem, "on");
    }

    focusOutHandler(){
        this.switchButtonsDisplay(this.chapterItem, "off");
    }

    switchButtonsDisplay(target, mode) {
        let xMark = this.chapterItem.querySelector('.delete-chapter');
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

    async changeChapterDisplay(_target) {
        await this.documentPresenter.changeCurrentElement(this.chapterItem, this.focusOutHandler.bind(this));
        await this.highlightChapter(_target);
        this.chapter.visibility === "hide" ? this.chapter.visibility = "show" : this.chapter.visibility = "hide";
        let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
        paragraphsContainer.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }
}



