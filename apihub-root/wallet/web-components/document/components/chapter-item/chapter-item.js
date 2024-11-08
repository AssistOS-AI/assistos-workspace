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
                if (this.chapter.backgroundSound) {
                    if (assistOS.space.currentChapterId === this.chapter.id) {
                        this.switchPlayButtonDisplay("on");
                    }
                } else {
                    if (assistOS.space.currentChapterId === this.chapter.id) {
                        this.switchPlayButtonDisplay("off");
                    }
                }
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
        if (this.chapter.backgroundSound && !this.chapter.backgroundSound.duration) {
            let audio = new Audio();
            audio.addEventListener("loadedmetadata", async () => {
                this.chapter.backgroundSound.duration = audio.duration;
                await documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, this.chapter.backgroundSound);
                audio.remove();
            });
            audio.src = await spaceModule.getAudioURL(this.chapter.backgroundSound.id);
            audio.load();
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

    switchPlayButtonDisplay(mode) {
        let playButton = this.chapterItem.querySelector('.background-sound-play');
        if (mode === "on" && this.chapter.backgroundSound) {
            playButton.classList.remove("hidden");
            playButton.classList.add("flex");
        } else {
            playButton.classList.add("hidden");
            playButton.classList.remove("flex");
        }
    }

    switchButtonsDisplay(targetElement, mode) {
        let actionCell = this.element.querySelector('.action-cell');
        mode === "on" ? actionCell.style.visibility = "visible" : actionCell.style.visibility = "hidden";
        this.switchPlayButtonDisplay(mode);
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

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    getParagraphPosition() {
        if (this.chapter.paragraphs.length === 0) {
            return 0;
        }
        if (assistOS.space.currentParagraphId) {
            return this.chapter.paragraphs.findIndex(p => p.id === assistOS.space.currentParagraphId);
        }
        return this.chapter.paragraphs.length;
    }

    uploadBackgroundSound(event) {
        const file = event.target.files[0];
        const maxFileSize = 100 * 1024 * 1024;
        if (file) {
            if (file.size > maxFileSize) {
                return showApplicationError("The file is too large.", "Maximum file size is 100MB.", "");
            }
            const reader = new FileReader();
            reader.onload = async (e) => {
                const uint8Array = new Uint8Array(e.target.result);
                let audioId = await spaceModule.putAudio(uint8Array);
                let audioPlayer = new Audio();
                audioPlayer.addEventListener("loadedmetadata", async () => {
                    let backgroundSound = {
                        id: audioId,
                        volume: "0.3",
                        duration: audioPlayer.duration
                    };
                    await documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, backgroundSound);
                    this.chapter.backgroundSound = backgroundSound;
                    this.fileInput.remove();
                    delete this.fileInput;
                    assistOS.UI.removeActionBox(this.actionBox, this);
                    this.switchPlayButtonDisplay("on");
                });
                audioPlayer.src = URL.createObjectURL(file);
            };
            reader.readAsArrayBuffer(file);
        }

    }

    insertBackgroundSound(_target) {
        if (!this.fileInput) {
            this.fileInput = document.createElement('input');
            this.fileInput.type = 'file';
            this.fileInput.accept = 'audio/mp3';
            this.fileInput.classList.add('hidden');
        }
        this.fileInput.addEventListener('change', this.uploadBackgroundSound.bind(this), {once: true});
        this.fileInput.click();
    }


    hideAudioElement(controller, playAudioButton, event) {
        if (event.target.closest(".chapter-audio-section")) {
            return;
        }
        let audio = this.element.querySelector('.chapter-audio');
        audio.pause();
        let audioSection = this.element.querySelector('.chapter-audio-section');
        audioSection.remove();
        controller.abort();
    };

    isAudioPlaying(audioElement) {
        return audioElement.paused === false && audioElement.currentTime > 0;
    }

    saveVolumeChanges(audio, event) {
        if (!this.timeoutId) {
            this.timeoutId = setTimeout(async () => {
                this.chapter.backgroundSound.volume = audio.volume;
                await documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, {
                    id: this.chapter.backgroundSound.id,
                    volume: audio.volume,
                    loop: this.chapter.backgroundSound.loop,
                    duration: this.chapter.backgroundSound.duration
                });
                delete this.timeoutId;
            }, 2000);
        }
    }

    async playBackgroundAudio(_target) {
        let chapterAudio = this.element.querySelector('.chapter-audio-section');
        if (chapterAudio) {
            return;
        }
        let audioSection = `<div class="chapter-audio-section flex">
            <div class="top-audio-section">
                <audio class="chapter-audio" controls preload="metadata"></audio>
                <div class="icon-container">
                    <svg class="pointer" data-local-action="deleteBackgroundSound" width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.3974 3.02564H13.6154V2.26923C13.6154 1.66739 13.3763 1.09021 12.9507 0.664642C12.5252 0.239079 11.948 0 11.3462 0H6.80769C6.20585 0 5.62867 0.239079 5.2031 0.664642C4.77754 1.09021 4.53846 1.66739 4.53846 2.26923V3.02564H0.75641C0.555798 3.02564 0.363402 3.10533 0.221548 3.24719C0.0796931 3.38904 0 3.58144 0 3.78205C0 3.98266 0.0796931 4.17506 0.221548 4.31691C0.363402 4.45877 0.555798 4.53846 0.75641 4.53846H1.51282V18.1538C1.51282 18.5551 1.67221 18.9399 1.95592 19.2236C2.23962 19.5073 2.62442 19.6667 3.02564 19.6667H15.1282C15.5294 19.6667 15.9142 19.5073 16.1979 19.2236C16.4816 18.9399 16.641 18.5551 16.641 18.1538V4.53846H17.3974C17.598 4.53846 17.7904 4.45877 17.9323 4.31691C18.0742 4.17506 18.1538 3.98266 18.1538 3.78205C18.1538 3.58144 18.0742 3.38904 17.9323 3.24719C17.7904 3.10533 17.598 3.02564 17.3974 3.02564ZM7.5641 14.3718C7.5641 14.5724 7.48441 14.7648 7.34255 14.9067C7.2007 15.0485 7.0083 15.1282 6.80769 15.1282C6.60708 15.1282 6.41468 15.0485 6.27283 14.9067C6.13097 14.7648 6.05128 14.5724 6.05128 14.3718V8.32051C6.05128 8.1199 6.13097 7.9275 6.27283 7.78565C6.41468 7.64379 6.60708 7.5641 6.80769 7.5641C7.0083 7.5641 7.2007 7.64379 7.34255 7.78565C7.48441 7.9275 7.5641 8.1199 7.5641 8.32051V14.3718ZM12.1026 14.3718C12.1026 14.5724 12.0229 14.7648 11.881 14.9067C11.7392 15.0485 11.5468 15.1282 11.3462 15.1282C11.1455 15.1282 10.9531 15.0485 10.8113 14.9067C10.6694 14.7648 10.5897 14.5724 10.5897 14.3718V8.32051C10.5897 8.1199 10.6694 7.9275 10.8113 7.78565C10.9531 7.64379 11.1455 7.5641 11.3462 7.5641C11.5468 7.5641 11.7392 7.64379 11.881 7.78565C12.0229 7.9275 12.1026 8.1199 12.1026 8.32051V14.3718ZM12.1026 3.02564H6.05128V2.26923C6.05128 2.06862 6.13097 1.87622 6.27283 1.73437C6.41468 1.59251 6.60708 1.51282 6.80769 1.51282H11.3462C11.5468 1.51282 11.7392 1.59251 11.881 1.73437C12.0229 1.87622 12.1026 2.06862 12.1026 2.26923V3.02564Z" fill="#3478C6"/>
                    </svg>
                </div>

            </div>
            <div class="loop-input-container">
                <label for="loop" class="form-label">Loop</label>
                <input type="checkbox" id="loop">
            </div>
        </div>`;
        let chapterTitle = this.element.querySelector(".chapter-title");
        chapterTitle.insertAdjacentHTML("afterend", audioSection);

        let audio = this.element.querySelector('.chapter-audio');
        if (!this.isAudioPlaying(audio)) {
            audio.src = await spaceModule.getAudioURL(this.chapter.backgroundSound.id);
            audio.load();
            audio.play();
        }
        audio.addEventListener('volumechange', this.saveVolumeChanges.bind(this, audio), {passive: true});
        let loopInput = this.element.querySelector('#loop');

        if (typeof this.chapter.backgroundSound.loop === "undefined") {
            loopInput.checked = true;
            audio.loop = true;
        } else {
            loopInput.checked = this.chapter.backgroundSound.loop;
            audio.loop = this.chapter.backgroundSound.loop;
        }
        loopInput.addEventListener('change', this.saveLoopChanges.bind(this));
        audio.volume = this.chapter.backgroundSound.volume;

        let controller = new AbortController();
        this.boundHideAudioElement = this.hideAudioElement.bind(this, controller, _target);
        document.addEventListener("click", this.boundHideAudioElement, {signal: controller.signal});
    }

    saveLoopChanges() {
        let audio = this.element.querySelector('.chapter-audio');
        let loopInput = this.element.querySelector('#loop');
        const isLooping = this.chapter.backgroundSound.loop === true;
        if (loopInput.checked !== isLooping) {
            this.chapter.backgroundSound.loop = loopInput.checked;
            documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, {
                id: this.chapter.backgroundSound.id,
                loop: loopInput.checked,
                volume: this.chapter.backgroundSound.volume,
                duration: this.chapter.backgroundSound.duration
            });
            audio.loop = loopInput.checked;
        }
    }

    async deleteBackgroundSound() {
        this.switchPlayButtonDisplay("off");
        delete this.chapter.backgroundSound;
        await documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, null);
        this.switchPlayButtonDisplay("off");
        let chapterAudioSection = this.element.querySelector('.chapter-audio-section');
        chapterAudioSection.remove();
        document.removeEventListener("click", this.boundHideAudioElement);
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
                return selectionUtils.lockText(this.titleClass, this);
            }
        } else {
            selectionUtils.removeUserIcon(data.selectId, this);
            if(!data.lockOwner){
                selectionUtils.unlockText(this.titleClass, this);
            }
        }
    }
}



