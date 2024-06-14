const {notificationService} = require("assistos").loadModule("util", {});
const spaceModule = require("assistos").loadModule("space", {});

export class ParagraphItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this._document = this.documentPresenter._document;
        let paragraphId = this.element.getAttribute("data-paragraph-id");
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.paragraph = this.chapter.getParagraph(paragraphId);
        notificationService.on(this.paragraph.id, async () => {
            let ttsItem = this.element.querySelector('text-to-speech');
            if (ttsItem) {
                this.openTTSItem = true;
            }
            let paragraphDiv = this.element.querySelector(".paragraph-text");
            if(!paragraphDiv){
                //notification received before render
                return this.invalidate();
            }
            let paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
            if (paragraph.text !== this.paragraph.text) {
                this.paragraph = paragraph;
                this.invalidate();
            }
        });
        this.invalidate();
    }

    beforeRender() {

    }

    afterRender() {
        let chapterElement = this.element.closest("chapter-item");
        this.chapterPresenter = chapterElement.webSkelPresenter;
        let paragraphText = this.element.querySelector(".paragraph-text");
        paragraphText.innerHTML = this.paragraph.text;
        let paragraphHeight = paragraphText.scrollHeight + 20;
        paragraphText.style.height = paragraphText.scrollHeight + 'px';
        if (this.openTTSItem) {
            this.openTTSPopup(this.element);
            this.openTTSItem = false;
        }
        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphText.click();
        }
        if (assistOS.space.currentChapterId === this.chapter.id && assistOS.space.currentParagraphId !== this.paragraph.id) {
            paragraphText.classList.add("unfocused");
        }
    }



    async moveParagraph(_target, direction) {
        await this.timer.stop(true);
        const currentParagraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
        const getAdjacentParagraphId = (index, paragraphs) => {
            if (direction === "up") {
                return index === 0 ? paragraphs[paragraphs.length - 1].id : paragraphs[index - 1].id;
            }
            return index === paragraphs.length - 1 ? paragraphs[0].id : paragraphs[index + 1].id;
        };
        const adjacentParagraphId = getAdjacentParagraphId(currentParagraphIndex, this.chapter.paragraphs);
        await assistOS.callFlow("SwapParagraphs", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: this.chapter.id,
            paragraphId1: this.paragraph.id,
            paragraphId2: adjacentParagraphId
        });
    }
    async saveParagraph(paragraph) {
        if (!this.paragraph || assistOS.space.currentParagraphId !== this.paragraph.id || this.deleted) {
            await this.documentPresenter.stopTimer();
            return;
        }
        let paragraphText = assistOS.UI.sanitize(paragraph.value);
        if (paragraphText !== this.paragraph.text) {
            this.paragraph.text = paragraphText;
            await assistOS.callFlow("UpdateParagraphText", {
                spaceId: assistOS.space.id,
                documentId: this._document.id,
                chapterId: this.chapter.id,
                paragraphId: this.paragraph.id,
                text: paragraphText
            });
        }

    }
    switchParagraphArrows(target, mode) {
        let audioIcon = this.element.querySelector('.audio-icon');
        if(mode === "on"){
            audioIcon.classList.remove("hidden");
        }else {
            audioIcon.classList.add("hidden");
        }
        if (this.chapter.paragraphs.length <= 1) {
            return;
        }
        let arrows = this.element.querySelector('.paragraph-arrows');
        if (mode === "on") {
            arrows.style.visibility = "visible";
        } else {
            arrows.style.visibility = "hidden";
        }
    }
    highlightParagraph(paragraph) {
        paragraph.classList.remove("unfocused");
        let paragraphItem = assistOS.UI.reverseQuerySelector(paragraph, ".paragraph-item");
        let paragraphId = paragraphItem.getAttribute("data-paragraph-id");
        this.switchParagraphArrows(paragraphItem, "on");
        assistOS.space.currentParagraphId = paragraphId;
    }
    focusoutCallback(paragraphItem) {
        this.switchParagraphArrows(paragraphItem, "off");
        //await this.timer.stop(true);
    }
    openTTSPopup(_target) {
        let personalitiesPopUp = `<text-to-speech data-presenter="select-personality-tts" data-chapter-id="${this.chapter.id}" data-paragraph-id="${this.paragraph.id}"></text-to-speech>`;
        this.element.insertAdjacentHTML('beforeend', personalitiesPopUp);
    }
    async resetTimer (paragraph, event) {
        paragraph.style.height = "auto";
        paragraph.style.height = paragraph.scrollHeight + 'px';
        if (paragraph.value.trim() === "" && event.key === "Backspace") {
            if (assistOS.space.currentParagraphId === this.paragraph.id) {
                this.deleted = true;
                let curentParagraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
                await assistOS.callFlow("DeleteParagraph", {
                    spaceId: assistOS.space.id,
                    documentId: this._document.id,
                    chapterId: this.chapter.id,
                    paragraphId: this.paragraph.id
                });
                if (this.chapter.paragraphs.length > 0) {
                    if (curentParagraphIndex === 0) {
                        assistOS.space.currentParagraphId = this.chapter.paragraphs[0].id;
                    } else {
                        assistOS.space.currentParagraphId = this.chapter.paragraphs[curentParagraphIndex - 1].id;
                    }
                } else {
                    assistOS.space.currentParagraphId = null;
                }
            }
            await this.documentPresenter.stopTimer();
        } else {
            await this.documentPresenter.resetTimer();
        }
    }
}