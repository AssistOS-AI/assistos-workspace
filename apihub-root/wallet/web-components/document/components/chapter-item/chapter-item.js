import {unescapeHtmlEntities} from "../../../../imports.js";

const documentModule = require("assistos").loadModule("document", {});
const utilModule = require("assistos").loadModule("util", {});
const spaceModule = require("assistos").loadModule("space", {});

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
        this.addParagraphOrChapterOnKeyPress = this.addParagraphOrChapterOnKeyPress.bind(this);
        this.element.removeEventListener('keydown', this.addParagraphOrChapterOnKeyPress);
        this.element.addEventListener('keydown', this.addParagraphOrChapterOnKeyPress);
        this.invalidate(async () => {
            if (!this.documentPresenter.childrenSubscriptions.has(this.chapter.id)) {
                await this.subscribeToChapterEvents();
                this.documentPresenter.childrenSubscriptions.set(this.chapter.id, this.chapter.id);
            }
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

    subscribeToChapterEvents() {
        utilModule.subscribeToObject(this.chapter.id, async (type) => {
            switch (type) {
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
        this.element.setAttribute("data-local-action", "highlightChapter");
        this.renderChapterTitle();
        this.chapterItem = this.element.querySelector(".chapter-item");
        if (this.chapter.id === assistOS.space.currentChapterId && !assistOS.space.currentParagraphId) {
            this.chapterItem.click();
        }
        if (this.chapter.visibility === "hide") {
            this.changeChapterVisibility("hide");
        }
        //for release 3.0
        // this.limit = 3;
        // this.queue = [];
        // this.activeFunctions = 0;
        // const paragraphs = this.element.querySelectorAll('paragraph-item[data-loaded="false"]');
        // const options = {
        //     root: null, // Use the viewport
        //     threshold: 0.5 // Trigger when 10% of paragraph is visible
        // };
        // this.visibilityObserver = new IntersectionObserver(async (entries, observer) => {
        //     for(let entry of entries) {
        //         if (entry.isIntersecting) {
        //             const paragraph = entry.target;
        //             let hasExecutedAfterRender = paragraph.getAttribute("data-initialized");
        //             if(hasExecutedAfterRender) {
        //                 let paragraphPresenter = paragraph.webSkelPresenter;
        //                 if(paragraphPresenter.paragraph.commands.video && !paragraphPresenter.paragraph.commands.video.thumbnailId) {
        //                     await this.addAsyncLoadDataFN(paragraphPresenter.uploadVideoThumbnail.bind(paragraphPresenter));
        //                 }
        //                 this.visibilityObserver.unobserve(paragraph);
        //             } else {
        //                 paragraph.executeUploadThumbnail = true;
        //             }
        //             paragraph.setAttribute("data-loaded", "true");
        //         }
        //     }
        // }, options);
        // paragraphs.forEach(paragraph => {
        //     this.visibilityObserver.observe(paragraph);
        // });
    }
    // async addAsyncLoadDataFN(executeFN) {
    //     return new Promise((resolve, reject) => {
    //         this.queue.push({ executeFN, resolve, reject });
    //         this.runNext();
    //     });
    // }
    //
    // async runNext() {
    //     if (this.activeFunctions < this.limit && this.queue.length > 0) {
    //         const { executeFN, resolve, reject } = this.queue.shift();
    //         this.activeFunctions++;
    //         try {
    //             const result = await executeFN();
    //             resolve(result);
    //         } catch (error) {
    //             reject(error);
    //         } finally {
    //             this.activeFunctions--;
    //             setTimeout(() => this.runNext(), 500);
    //         }
    //     }
    // }

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
            let position = this._document.getChapterIndex(this.chapter.id);
            if (assistOS.space.currentChapterId) {
                position = this._document.getChapterIndex(assistOS.space.currentChapterId) + 1;
            }

            assistOS.space.currentChapterId = (await assistOS.callFlow("AddChapter", {
                spaceId: assistOS.space.id,
                documentId: this._document.id,
                position: position
            })).data;
            this.documentPresenter.invalidate(this.documentPresenter.refreshDocument);

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
            this.invalidate(this.refreshChapter);
        }
    }


    async highlightChapter() {
        assistOS.space.currentChapterId = this.chapter.id;
        this.switchButtonsDisplay(this.chapterItem, "on");
    }


    focusOutHandler(chapterTitle) {
        this.switchButtonsDisplay(this.chapterItem, "off");
        chapterTitle.classList.remove("focused");
    }

    switchPlayButtonDisplay(mode) {
        let playButton = this.chapterItem.querySelector('.background-sound-play');
        if (mode === "on" && this.hasBackgroundSound) {
            playButton.classList.remove("hidden");
            playButton.classList.add("flex");
        } else {
            playButton.classList.add("hidden");
            playButton.classList.remove("flex");
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
                let audioBuffer = await spaceModule.getAudio(assistOS.space.id, paragraph.audio.id);
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

    uploadSoundEffects(event) {
        const file = event.target.files[0];
        const maxFileSize = 15 * 1024 * 1024;
        if (file) {
            if (file.size > maxFileSize) {
                return showApplicationError("The file is too large.", "Maximum file size is 15MB.", "");
            }
            const reader = new FileReader();
            reader.onload = async (e) => {
                const uint8Array = new Uint8Array(e.target.result);
                let audioId = await spaceModule.putAudio(assistOS.space.id, uint8Array);
                let backgroundSound = {
                    id: audioId,
                    volume: "0.3"
                };
                await documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, backgroundSound);
                this.chapter.backgroundSound = backgroundSound;
                this.hasBackgroundSound = true;
                this.fileInput.remove();
                delete this.fileInput;
                assistOS.UI.removeActionBox(this.actionBox, this);
                this.switchPlayButtonDisplay("on");
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
        this.fileInput.addEventListener('change', this.uploadSoundEffects.bind(this), {once: true});
        this.fileInput.click();
    }


    hideAudioElement(controller, playAudioButton, event) {
        if (event.target.closest(".chapter-audio-section")) {
            return;
        }
        let audio = this.element.querySelector('.chapter-audio');
        audio.pause();
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
                this.chapter.backgroundSound.volume = audio.volume;
                await documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, {
                    id: this.chapter.backgroundSound.id,
                    volume: audio.volume
                });
                delete this.timeoutId;
            }, 2000);
        }
    }

    async playBackgroundAudio(_target, mode) {
        if (mode === "off") {
            let audioSection = this.element.querySelector('.chapter-audio-section');
            let audio = this.element.querySelector('.chapter-audio');
            if (!this.isAudioPlaying(audio)) {
                audio.src = await spaceModule.getAudioURL(assistOS.space.id, this.chapter.backgroundSound.id);
                audio.load();
                audio.play();
            }
            audio.removeEventListener('volumechange', this.boundSaveVolumeChanges);
            if (!this.boundSaveVolumeChanges) {
                this.boundSaveVolumeChanges = this.saveVolumeChanges.bind(this, audio);
            }
            audio.addEventListener('volumechange', this.boundSaveVolumeChanges, {passive: true});
            let loopInput = this.element.querySelector('#loop');
            loopInput.removeEventListener('change', this.boundSaveLoopChanges);

            if(typeof this.chapter.backgroundSound.loop === "undefined") {
                loopInput.checked = true;
                audio.loop = true;
            } else {
                loopInput.checked = this.chapter.backgroundSound.loop;
                audio.loop = this.chapter.backgroundSound.loop;
            }
            loopInput.removeEventListener('change', this.boundSaveLoopChanges);
            if(!this.boundSaveLoopChanges) {
                this.boundSaveLoopChanges = this.saveLoopChanges.bind(this);
            }
            loopInput.addEventListener('change', this.boundSaveLoopChanges);

            audioSection.classList.remove('hidden');
            audioSection.classList.add('flex');
            audio.volume = this.chapter.backgroundSound.volume;



            let controller = new AbortController();
            document.addEventListener("click", this.hideAudioElement.bind(this, controller, _target), {signal: controller.signal});
            _target.setAttribute("data-local-action", "playBackgroundAudio on");
        }
    }
    saveLoopChanges(){
        let audio = this.element.querySelector('.chapter-audio');
        let loopInput = this.element.querySelector('#loop');
        const isLooping = this.chapter.backgroundSound.loop === true;
        if(loopInput.checked !== isLooping) {
            this.chapter.backgroundSound.loop = loopInput.checked;
            documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, {
                id: this.chapter.backgroundSound.id,
                loop: loopInput.checked,
                volume: this.chapter.backgroundSound.volume
            });
            audio.loop = loopInput.checked;
        }
    }
    async deleteBackgroundSound() {
        this.switchPlayButtonDisplay("off");
        delete this.chapter.backgroundSound;
        await documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, null);
        this.hasBackgroundSound = false;
        this.switchPlayButtonDisplay("off");
        document.click();
    }

    async deleteChapter(_target) {
        await assistOS.callFlow("DeleteChapter", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: this.chapter.id
        });
        this.documentPresenter.invalidate(this.documentPresenter.refreshDocument);
    }
}



