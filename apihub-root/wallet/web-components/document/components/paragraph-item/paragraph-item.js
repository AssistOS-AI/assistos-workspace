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
        paragraphText.style.height = paragraphText.scrollHeight + 'px';
        if (this.openTTSItem) {
            this.openTTSPopup(this.element);
            this.openTTSItem = false;
        }
        const audioIcon = this.element.querySelector('.audio-icon');
        if(this.paragraph.audio.audioBlob){
            this.hasAudio = true;
        }
        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphText.click();
        }

        if(!this.boundPreventSelectionChange){
            this.boundPreventSelectionChange = this.preventSelectionChange.bind(this);
        }
        if(!this.boundUpdateIconDisplay){
            this.boundUpdateIconDisplay = this.updateIconDisplay.bind(this, audioIcon);
        }
        if(!this.boundSelectionChangeHandler){
            this.boundSelectionChangeHandler = this.selectionChangeHandler.bind(this, paragraphText, audioIcon);
        }
        if(!this.boundMouseDownAudioIconHandler){
            this.boundMouseDownAudioIconHandler = this.mouseDownAudioIconHandler.bind(this, paragraphText, audioIcon);
        }
    }

    async moveParagraph(_target, direction) {
        await this.documentPresenter.stopTimer(true);
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
            await this.documentPresenter.stopTimer(true);
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
    switchParagraphArrows(mode) {
        if(this.hasAudio){
            let audioIcon = this.element.querySelector('.audio-icon');
            if(mode === "on"){
                audioIcon.classList.remove("hidden");
            }else {
                audioIcon.classList.add("hidden");
            }
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
    highlightParagraph() {
        this.switchParagraphArrows("on");
        assistOS.space.currentParagraphId = this.paragraph.id;
        let paragraphText = this.element.querySelector('.paragraph-text');
        const audioIcon = this.element.querySelector('.audio-icon');
        if(!this.hasAudio){
            paragraphText.addEventListener('mouseup', this.boundUpdateIconDisplay);
            document.addEventListener('selectionchange', this.boundSelectionChangeHandler);
            document.addEventListener('mousedown', this.boundMouseDownAudioIconHandler);
            audioIcon.addEventListener('mousedown', this.boundPreventSelectionChange);
        }

    }
    focusOutHandler() {
        this.chapterPresenter.focusOutHandler();
        this.switchParagraphArrows("off");
        let paragraphText = this.element.querySelector('.paragraph-text');
        paragraphText.removeEventListener('mouseup', this.boundUpdateIconDisplay);
        document.removeEventListener('selectionchange', this.boundSelectionChangeHandler);
        document.removeEventListener('mousedown', this.boundMouseDownAudioIconHandler);
    }
    mouseDownAudioIconHandler(paragraphText, audioIcon, event) {
        if (!paragraphText.contains(event.target) && !audioIcon.contains(event.target)) {
            audioIcon.classList.add("hidden");
        }
    }
    selectionChangeHandler(paragraphText, audioIcon, event) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().length > 0 && paragraphText.contains(selection.anchorNode)) {
            this.updateIconDisplay(audioIcon);
        } else {
            audioIcon.classList.add("hidden");
        }
    }
    preventSelectionChange(event) {
        event.preventDefault();
    }
    updateIconDisplay(audioIcon, event) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().length > 0) {
            audioIcon.classList.remove("hidden");
        } else {
            audioIcon.classList.add("hidden");
        }
    }
    showTTSPopup(_target, mode) {
        if (mode === "off") {
            this.selectionText = window.getSelection().toString();
            let ttsPopup = `<text-to-speech data-presenter="select-personality-tts" data-chapter-id="${this.chapter.id}" data-paragraph-id="${this.paragraph.id}"></text-to-speech>`;
            this.element.insertAdjacentHTML('beforeend', ttsPopup);
            let controller = new AbortController();
            document.addEventListener("click", this.hideTTSPopup.bind(this, controller, _target), {signal: controller.signal});
            _target.setAttribute("data-local-action", "showTTSPopup on");
        }
    }

    hideTTSPopup(controller, arrow, event) {
        if(event.target.closest("text-to-speech") || event.target.tagName === "A"){
            return;
        }
        arrow.setAttribute("data-local-action", "showTTSPopup off");
        let popup = this.element.querySelector("text-to-speech");
        popup.remove();
        controller.abort();
    };
    async resetTimer (paragraph, event) {
        paragraph.style.height = "auto";
        paragraph.style.height = paragraph.scrollHeight + 'px';
        if (paragraph.value.trim() === "" && event.key === "Backspace") {
            if (assistOS.space.currentParagraphId === this.paragraph.id) {
                await this.documentPresenter.stopTimer(false);
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
        } else {
            await this.documentPresenter.resetTimer();
        }
    }
}