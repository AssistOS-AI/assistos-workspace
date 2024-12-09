import {unescapeHtmlEntities} from "../../../../imports.js";
import {NotificationRouter} from "../../../../imports.js";
import selectionUtils from "../../pages/document-view-page/selectionUtils.js";
const documentModule = require("assistos").loadModule("document", {});
const spaceModule = require("assistos").loadModule("space", {});

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
        this.addParagraphOrChapterOnKeyPress = this.addParagraphOrChapterOnKeyPress.bind(this);
        this.element.removeEventListener('keydown', this.addParagraphOrChapterOnKeyPress);
        this.element.addEventListener('keydown', this.addParagraphOrChapterOnKeyPress);
        this.titleId = `${this.chapter.id}_title`;
        this.titleClass = "chapter-title";
        this.boundHandleUserSelection = this.handleUserSelection.bind(this);
        this.boundCloseChapterComment = this.closeChapterComment.bind(this);
        this.invalidate(async () => {
            this.boundOnChapterUpdate = this.onChapterUpdate.bind(this);
            await NotificationRouter.subscribeToDocument(this._document.id, this.chapter.id, this.boundOnChapterUpdate);
            await NotificationRouter.subscribeToDocument(this._document.id, this.titleId, this.boundHandleUserSelection);
        });

    }

    beforeRender() {
        //await documentModule.updateChapterCommands(assistOS.space.id, this._document.id, this.chapter.id, this.chapter.commands);
        if (this._document.chapters.length === 1) {
            this.toggleSwapArrows = "hide";
        } else {
            this.toggleSwapArrows = "show";
        }
        this.titleMetadata = this.element.variables["data-title-metadata"];
        this.chapterContent = "";

        let iterator = 0;
        this.chapter.paragraphs.forEach((paragraph) => {
            iterator++;
            this.chapterContent += `<paragraph-item data-local-action="editItem paragraph" data-presenter="paragraph-item" data-metadata="paragraph nr. ${iterator} with id ${paragraph.id}" data-paragraph-id="${paragraph.id}" data-chapter-id="${this.chapter.id}"></paragraph-item>`;
        });
    }

    async insertNewParagraph(paragraphId, position) {
        let newParagraph = await documentModule.getParagraph(assistOS.space.id, this._document.id, paragraphId);
        this.chapter.paragraphs.splice(position, 0, newParagraph);
        let previousParagraphIndex = position - 1;
        if (previousParagraphIndex < 0) {
            previousParagraphIndex = 0;
        }
        let previousParagraphId = this.chapter.paragraphs[previousParagraphIndex].id;
        let previousParagraph = this.element.querySelector(`paragraph-item[data-paragraph-id="${previousParagraphId}"]`);
        if (!previousParagraph) {
            let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
            paragraphsContainer.insertAdjacentHTML("afterbegin", `<paragraph-item data-local-action="editItem paragraph" data-presenter="paragraph-item" data-metadata="paragraph nr. ${position + 1} with id ${newParagraph.id}" data-paragraph-id="${newParagraph.id}" data-chapter-id="${this.chapter.id}"></paragraph-item>`);
            return;
        }
        previousParagraph.insertAdjacentHTML("afterend", `<paragraph-item data-local-action="editItem paragraph" data-presenter="paragraph-item" data-metadata="paragraph nr. ${position + 1} with id ${newParagraph.id}" data-paragraph-id="${newParagraph.id}" data-chapter-id="${this.chapter.id}"></paragraph-item>`);
    }

    deleteParagraph(paragraphId) {
        this.chapter.paragraphs = this.chapter.paragraphs.filter(paragraph => paragraph.id !== paragraphId);
        let paragraph = this.element.querySelector(`paragraph-item[data-paragraph-id="${paragraphId}"]`);
        paragraph.remove();
    }

    swapParagraphs(paragraphId, swapParagraphId, direction) {
        let paragraphs = this.chapter.paragraphs;
        let currentParagraphIndex = this.chapter.getParagraphIndex(paragraphId);
        let adjacentParagraphIndex = this.chapter.getParagraphIndex(swapParagraphId);

        let paragraph1 = this.element.querySelector(`paragraph-item[data-paragraph-id="${paragraphId}"]`);
        let paragraph2 = this.element.querySelector(`paragraph-item[data-paragraph-id="${swapParagraphId}"]`);
        if (direction === "up") {
            if (adjacentParagraphIndex === this.chapter.paragraphs.length - 1) {
                paragraphs.push(paragraphs.shift());
                paragraph2.insertAdjacentElement('afterend', paragraph1);
                return;
            }
            [paragraphs[currentParagraphIndex], paragraphs[adjacentParagraphIndex]] = [paragraphs[adjacentParagraphIndex], paragraphs[currentParagraphIndex]];
            paragraph2.insertAdjacentElement('beforebegin', paragraph1);
        } else {
            // Insert the current paragraph after the adjacent one
            if (adjacentParagraphIndex === 0) {
                paragraphs.unshift(paragraphs.pop());
                paragraph2.insertAdjacentElement('beforebegin', paragraph1);
                return;
            }
            [paragraphs[currentParagraphIndex], paragraphs[adjacentParagraphIndex]] = [paragraphs[adjacentParagraphIndex], paragraphs[currentParagraphIndex]];
            paragraph2.insertAdjacentElement('afterend', paragraph1);
        }
    }

    async onChapterUpdate(data) {
        if (typeof data === "object") {
            if (data.operationType === "add") {
                return await this.insertNewParagraph(data.paragraphId, data.position);
            }
            if (data.operationType === "delete") {
                return this.deleteParagraph(data.paragraphId);
            }
            if (data.operationType === "swap") {
                return this.swapParagraphs(data.paragraphId, data.swapParagraphId, data.direction);
            }
        }
        switch (data) {
            case "title": {
                let title = await documentModule.getChapterTitle(assistOS.space.id, this._document.id, this.chapter.id);
                if (title !== this.chapter.title) {
                    this.chapter.title = title;
                    this.renderChapterTitle();
                }
                return;
            }
            case "backgroundSound": {
                this.chapter.backgroundSound = await documentModule.getChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id);
                return;
            }
            case "visibility": {
                //dont do anything
                return;
            }
            default: {
                let chapterIndex = this._document.getChapterIndex(this.chapter.id);
                console.error(`chapterItem index ${chapterIndex}: Unknown update type: ${data}`);
            }
        }
    }

    async saveTitle(titleElement) {
        let titleText = assistOS.UI.sanitize(titleElement.value);
        if (titleText !== this.chapter.title && titleText !== "") {
            this.chapter.title = titleText;
            await documentModule.updateChapterTitle(assistOS.space.id, this._document.id, this.chapter.id, titleText);
        }
    }

    renderChapterTitle() {
        let chapterTitle = this.element.querySelector(".chapter-title");
        chapterTitle.value = unescapeHtmlEntities(this.chapter.title);
    }

    async afterRender() {
        this.element.setAttribute("data-local-action", "highlightChapter");
        this.renderChapterTitle();
        this.chapterItem = this.element.querySelector(".chapter-item");
        if (this.chapter.id === assistOS.space.currentChapterId && !assistOS.space.currentParagraphId) {
            this.chapterItem.click();
        }
        if (this.chapter.visibility === "hide") {
            this.changeChapterVisibility("hide");
        }
        //for demo documents
        if (this.chapter.backgroundSound) {
           if(this.chapter.backgroundSound.volume <= 1){
                this.chapter.backgroundSound.volume = this.chapter.backgroundSound.volume * 100;
                await documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, this.chapter.backgroundSound);
           }
        }
    }

    async addParagraphOrChapterOnKeyPress(event) {
        if (!event.ctrlKey || event.key !== "Enter") {
            return;
        }
        // Stop the timer
        this.documentPresenter.stopTimer(true);

        const fromParagraph = assistOS.UI.reverseQuerySelector(event.target, '[data-paragraph-id]', 'space-chapter-item');
        const fromChapter = assistOS.UI.reverseQuerySelector(event.target, '.chapter-item');
        if (!fromParagraph && !fromChapter) {
            return;
        }
        // Check if Ctrl + Shift + Enter is pressed to add a chapter
        if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
            await this.documentPresenter.addChapter("", "below");
            // Else, if only Ctrl + Enter is pressed, add a paragraph
        } else if (event.ctrlKey && !event.shiftKey && event.key === "Enter") {
            let position = this.chapter.paragraphs.length;
            if (assistOS.space.currentParagraphId) {
                position = this.chapter.getParagraphIndex(assistOS.space.currentParagraphId) + 1;
            }
            let paragraphObj = {
                text: "",
                position: position,
                commands: {}
            }

            assistOS.space.currentParagraphId = await documentModule.addParagraph(assistOS.space.id, this._document.id, this.chapter.id, paragraphObj);
            await this.insertNewParagraph(assistOS.space.currentParagraphId, position);
        }
    }


    async highlightChapter() {
        assistOS.space.currentChapterId = this.chapter.id;
        this.switchButtonsDisplay(this.chapterItem, "on");
    }

    async focusOutHandlerTitle(chapterTitle){
        this.focusOutHandler()
        chapterTitle.classList.remove("focused");
        await selectionUtils.deselectItem(this.titleId, this);
    }

    focusOutHandler() {
        assistOS.space.currentChapterId = null;
        this.switchButtonsDisplay(this.chapterItem, "off");
    }

    switchButtonsDisplay(targetElement, mode) {
        let chapterIcons = this.element.querySelector('.chapter-icons');
        mode === "on" ? chapterIcons.style.visibility = "visible" : chapterIcons.style.visibility = "hidden";
    }

    async changeChapterDisplay(_target) {
        await this.documentPresenter.changeCurrentElement(this.chapterItem, this.focusOutHandler.bind(this));
        await this.highlightChapter(_target);
        if (this.chapter.visibility === "hide") {
            this.changeChapterVisibility("show");
        } else {
            this.changeChapterVisibility("hide");
        }
        await documentModule.updateChapterVisibility(assistOS.space.id, this._document.id, this.chapter.id, this.chapter.visibility);
    }

    changeChapterVisibility(mode) {
        this.chapter.visibility = mode;
        if (mode === "hide") {
            let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
            paragraphsContainer.classList.add('hidden');
            let arrow = this.element.querySelector(".chapter-visibility-arrow");
            arrow.classList.add('rotate');
        } else {
            let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
            paragraphsContainer.classList.remove('hidden');
            let arrow = this.element.querySelector(".chapter-visibility-arrow");
            arrow.classList.remove('rotate');
            let paragraphs = this.element.querySelectorAll(".paragraph-text");
            for (let paragraph of paragraphs) {
                paragraph.style.height = paragraph.scrollHeight + 'px';
            }
        }
    }

    async downloadAllAudio() {
        let i = 1;
        let hasAudio = false;
        for (let paragraph of this.chapter.paragraphs) {
            if (paragraph.commands.audio) {
                hasAudio = true;
                let audioName = `audio${i}.mp3`;
                let audioBuffer = await spaceModule.getAudio(paragraph.audio.id);
                const blob = new Blob([audioBuffer], {type: 'audio/mp3'});
                let url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = audioName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                i++;
            }
        }
        if (!hasAudio) {
            alert("No audio to download!");
        }
    }
    async showBackgroundAudio(){
        await assistOS.UI.showModal("chapter-background-audio", {"chapter-id": this.chapter.id});
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async deleteChapter(_target) {
        await documentModule.deleteChapter(assistOS.space.id, this._document.id, this.chapter.id);
        this.documentPresenter.deleteChapter(this.chapter.id);
    }

    openChapterComment(_target) {
        const chapterMenu = `<chapter-comment-menu data-presenter="chapter-comment-menu"></chapter-comment-menu>`;
        this.element.querySelector('.chapter-title-container')?.insertAdjacentHTML('beforeend', chapterMenu);
        document.addEventListener('click', this.boundCloseChapterComment);
    }

    closeChapterComment(event) {
        if (event.target.closest('chapter-comment-menu')) {
            return;
        }
        document.removeEventListener('click', this.boundCloseChapterComment);
        this.element.querySelector('chapter-comment-menu')?.remove();
    }

    updateChapterNumber() {
        let chapterIndex = this._document.getChapterIndex(this.chapter.id);
        let chapterNumber = this.element.querySelector(".data-chapter-number");
        chapterNumber.innerHTML = `${chapterIndex + 1}.`;
    }
    async handleUserSelection(data){
        if(typeof data === "string"){
            return;
        }
        if(data.selected){
            await selectionUtils.setUserIcon(data.imageId, data.selectId, this.titleClass, this);
            if(data.lockOwner &&  data.lockOwner !== this.selectId){
                return selectionUtils.lockItem(this.titleClass, this);
            }
        } else {
            selectionUtils.removeUserIcon(data.selectId, this);
            if(!data.lockOwner){
                selectionUtils.unlockItem(this.titleClass, this);
            }
        }
    }
    async afterUnload(){
        if(this.selectionInterval){
            await selectionUtils.deselectItem(this.titleId, this);
        }
    }
}



