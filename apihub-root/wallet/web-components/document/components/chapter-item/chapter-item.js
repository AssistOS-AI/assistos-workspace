import {base64ToBlob, unescapeHtmlEntities} from "../../../../imports.js";
const documentModule = require("assistos").loadModule("document", {});
const utilModule = require("assistos").loadModule("util", {});

export class ChapterItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this._document = this.documentPresenter._document;
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        if (this.chapter.backgroundSound) {
            this.hasBackgroundSound = true;
        }
        this.refreshChapter = async () => {
            this.chapter = await this._document.refreshChapter(this._document.id, this.chapter.id);
        };
        this.addParagraphOnCtrlEnter = this.addParagraphOnCtrlEnter.bind(this);
        this.element.removeEventListener('keydown', this.addParagraphOnCtrlEnter);
        this.element.addEventListener('keydown', this.addParagraphOnCtrlEnter);
        this.invalidate(async () => {
            await this.subscribeToChapterEvents();
        });
    }

    beforeRender() {
        if (this._document.chapters.length === 1) {
            this.toggleSwapArrows = "hide";
        } else {
            this.toggleSwapArrows = "show";
        }
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
            if (paragraph.image) {
                this.chapterContent += `<image-paragraph data-presenter="image-paragraph" data-metadata="paragraph nr. ${iterator} with id ${paragraph.id}" data-paragraph-id="${paragraph.id}" data-chapter-id="${this.chapter.id}"></image-paragraph>`
            } else {
                this.chapterContent += `<paragraph-item data-presenter="paragraph-item" data-metadata="paragraph nr. ${iterator} with id ${paragraph.id}" data-paragraph-id="${paragraph.id}" data-chapter-id="${this.chapter.id}"></paragraph-item>`;
            }
        });
    }

    subscribeToChapterEvents() {
        utilModule.subscribeToObject(this.chapter.id, async (type) => {
            switch (type){
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
                        this.hasBackgroundSound = true;
                        if (assistOS.space.currentChapterId === this.chapter.id) {
                            this.switchPlayButtonDisplay("on");
                        }
                    } else {
                        this.hasBackgroundSound = false;
                        if (assistOS.space.currentChapterId === this.chapter.id) {
                            this.switchPlayButtonDisplay("off");
                        }
                    }
                    return;
                }
                default: {
                    this.invalidate(this.refreshChapter);
                }
            }
        });
    }
    async afterUnload() {
        await utilModule.unsubscribeFromObject(this.chapter.id);
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

    renderChapterTitle() {
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
        if (!this.boundPasteHandler) {
            this.boundPasteHandler = this.pasteHandler.bind(this);
            this.element.addEventListener('paste', this.boundPasteHandler);
        }
    }

    pasteHandler(event) {
        let clipboardData = event.clipboardData || window.clipboardData;
        let items = clipboardData.items;
        let position = this.getParagraphPosition();
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            if (item.type.indexOf('image') !== -1) {
                let blob = item.getAsFile();
                let reader = new FileReader();

                reader.onload = async (event) => {
                    let base64String = event.target.result;
                    await assistOS.callFlow("AddImageParagraph", {
                        spaceId: assistOS.space.id,
                        documentId: this._document.id,
                        chapterId: this.chapter.id,
                        paragraphData: {
                            position: position,
                            image: {src: base64String, alt: "pasted image"},
                            dimensions: {
                                width: "",
                                height: ""
                            }
                        }
                    });
                    position++;
                }

                reader.readAsDataURL(blob);
                event.preventDefault();
            }
        }
    }

    async addParagraphOnCtrlEnter(event) {
        if (!event.ctrlKey || event.key !== 'Enter') {
            return;
        }
        this.documentPresenter.stopTimer(true);
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

    focusOutHandler() {
        this.switchButtonsDisplay(this.chapterItem, "off");
    }

    switchPlayButtonDisplay(mode) {
        if (this.hasBackgroundSound) {
            let playButton = this.chapterItem.querySelector('.background-sound-play');
            if (mode === "on") {
                playButton.classList.remove("hidden");
                playButton.classList.add("flex");
            } else {
                playButton.classList.add("hidden");
                playButton.classList.remove("flex");
            }
        }
    }

    switchButtonsDisplay(target, mode) {
        let actionCell = this.chapterItem.querySelector('.action-cell');
        mode === "on" ? actionCell.style.visibility = "visible" : actionCell.style.visibility = "hidden";
        this.switchPlayButtonDisplay(mode);
    }

    async changeChapterDisplay(_target) {
        await this.documentPresenter.changeCurrentElement(this.chapterItem, this.focusOutHandler.bind(this));
        await this.highlightChapter(_target);
        this.chapter.visibility === "hide" ? this.chapter.visibility = "show" : this.chapter.visibility = "hide";
        let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
        paragraphsContainer.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }

    downloadAllAudio() {
        let i = 1;
        let hasAudio = false;
        for (let paragraph of this.chapter.paragraphs) {
            if (paragraph.audio) {
                hasAudio = true;
                let audioName = `audio${i}.mp3`;
                let url = URL.createObjectURL(base64ToBlob(paragraph.audio.base64Audio, "audio/mp3"));
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
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
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

    async openInsertImageModal(_target) {
        let position = this.getParagraphPosition();
        let imagesData = await assistOS.UI.showModal("insert-image-modal", {["chapter-id"]: this.chapter.id}, true);
        if (imagesData) {
            for (let image of imagesData) {
                await assistOS.callFlow("AddImageParagraph", {
                    spaceId: assistOS.space.id,
                    documentId: this._document.id,
                    chapterId: this.chapter.id,
                    paragraphData: {
                        position: position,
                        image: {
                            src: image.src,
                            alt: image.alt,
                            id: image.id
                        },
                        dimensions: {
                            width: "",
                            height: ""
                        }
                    }
                });
                position++;
            }
        }
    }

    uploadSoundEffects(event) {
        const file = event.target.files[0];
        const maxFileSize = 10 * 1024 * 1024;
        if (file) {
            if (file.size > maxFileSize) {
                return showApplicationError("The file is too large.", "Maximum file size is 10MB.", "");
            }
            const reader = new FileReader();
            reader.onload = async (e) => {
                let backgroundSound = {
                    base64Audio: e.target.result,
                    userId: assistOS.user.id,
                    volume: "default"
                };
                await assistOS.callFlow("UpdateChapterBackgroundSound", {
                    spaceId: assistOS.space.id,
                    documentId: this._document.id,
                    chapterId: this.chapter.id,
                    backgroundSound: backgroundSound
                });
                this.fileInput.remove();
                delete this.fileInput;
            };
            reader.readAsDataURL(file);
        }

    }

    insertBackgroundSound(_target) {
        if (!this.fileInput) {
            this.fileInput = document.createElement('input');
            this.fileInput.type = 'file';
            this.fileInput.accept = 'audio/*';
            this.fileInput.classList.add('hidden');
        }
        this.fileInput.addEventListener('change', this.uploadSoundEffects.bind(this), {once: true});
        this.fileInput.click();
    }


    hideAudioElement(controller, playAudioButton, event) {
        if (event.target.closest("audio") || event.target.closest(".background-sound-play")) {
            return;
        }
        playAudioButton.setAttribute("data-local-action", "playBackgroundAudio off");
        let audioSection = this.element.querySelector('.chapter-audio-section');
        audioSection.classList.add('hidden');
        audioSection.classList.remove('flex');
        controller.abort();
    };

    isAudioPlaying(audioElement) {
        return audioElement.paused === false && audioElement.currentTime > 0;
    }

    saveVolumeChanges(audio, event) {
        if (!this.timeoutId) {
            this.timeoutId = setTimeout(async () => {
                await assistOS.callFlow("UpdateChapterBackgroundSound", {
                    spaceId: assistOS.space.id,
                    documentId: this._document.id,
                    chapterId: this.chapter.id,
                    backgroundSound: {
                        base64Audio: this.chapter.backgroundSound.base64Audio,
                        userId: this.chapter.backgroundSound.userId,
                        volume: audio.volume
                    }

                });
                this.timeoutId = null;
            }, 2000);
        }
    }

    playBackgroundAudio(_target, mode) {
        if (mode === "off") {
            let audioSection = this.element.querySelector('.chapter-audio-section');
            let audio = this.element.querySelector('.chapter-audio');
            if (!this.isAudioPlaying(audio)) {
                audio.src = URL.createObjectURL(base64ToBlob(this.chapter.backgroundSound.base64Audio, "audio/mp3"));
                audio.load();
            }
            if (!this.boundSaveVolumeChanges) {
                this.boundSaveVolumeChanges = this.saveVolumeChanges.bind(this, audio);
                audio.addEventListener('volumechange', this.boundSaveVolumeChanges, {passive: true});
            }
            audioSection.classList.remove('hidden');
            audioSection.classList.add('flex');
            if (this.chapter.backgroundSound.volume !== "default") {
                audio.volume = this.chapter.backgroundSound.volume;
            }
            let controller = new AbortController();
            document.addEventListener("click", this.hideAudioElement.bind(this, controller, _target), {signal: controller.signal});
            _target.setAttribute("data-local-action", "playBackgroundAudio on");
        }
    }

    async deleteBackgroundSound() {
        this.switchPlayButtonDisplay("off");
        await assistOS.callFlow("UpdateChapterBackgroundSound", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: this.chapter.id,
            backgroundSound: null
        });
    }
}



