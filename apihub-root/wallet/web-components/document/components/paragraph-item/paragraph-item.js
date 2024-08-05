const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});
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
        this.invalidate(async () => {
            if (!this.documentPresenter.childrenSubscriptions.has(this.paragraph.id)) {
                await this.subscribeToParagraphEvents();
                this.documentPresenter.childrenSubscriptions.set(this.paragraph.id, this.paragraph.id);
            }
        });
    }

    async subscribeToParagraphEvents() {
        await utilModule.subscribeToObject(this.paragraph.id, async (type) => {
            if (type === "text") {
                let ttsItem = this.element.querySelector('text-to-speech');
                if (ttsItem) {
                    this.openTTSItem = true;
                }
                this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
                this.hasExternalChanges = true;
                this.invalidate();

            } else if (type === "audio") {
                this.paragraph.audio = await documentModule.getParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id);
                if (this.paragraph.audio) {
                    this.hasAudio = true;
                }
            }
        });
    }

    beforeRender() {

    }

    afterRender() {
        let paragraphText = this.element.querySelector(".paragraph-text");
        paragraphText.innerHTML = this.paragraph.text;
        paragraphText.style.height = paragraphText.scrollHeight + 'px';
        if (this.openTTSItem) {
            this.showTTSPopup(this.element, "off");
            this.openTTSItem = false;
        }
        // const audioIcon = this.element.querySelector('.audio-icon');
        if (this.paragraph.audioConfig) {
            this.hasAudio = true;
        }
        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphText.click();
        }

        if (!this.boundPreventSelectionChange) {
            this.boundPreventSelectionChange = this.preventSelectionChange.bind(this);
        }
        /*   if (!this.boundUpdateIconDisplay) {
               this.boundUpdateIconDisplay = this.updateIconDisplay.bind(this, audioIcon);
           }
           if (!this.boundSelectionChangeHandler) {
               this.boundSelectionChangeHandler = this.selectionChangeHandler.bind(this, paragraphText, audioIcon);
           }
           if (!this.boundMouseDownAudioIconHandler) {
               this.boundMouseDownAudioIconHandler = this.mouseDownAudioIconHandler.bind(this, paragraphText, audioIcon);*/
        if (this.isPlaying) {
            this.playParagraphAudio();
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
        let chapterElement = this.element.closest("chapter-item");
        let chapterPresenter = chapterElement.webSkelPresenter;
        chapterPresenter.invalidate(chapterPresenter.refreshChapter);
    }

    async saveParagraph(paragraph) {
        if (!this.paragraph || assistOS.space.currentParagraphId !== this.paragraph.id || this.deleted) {
            return;
        }
        let paragraphText = assistOS.UI.sanitize(paragraph.value);
        if (paragraphText !== this.paragraph.text) {
            if (this.hasExternalChanges) {
                this.hasExternalChanges = false;
                return;
            }
            this.paragraph.text = paragraphText;
            await assistOS.callFlow("UpdateParagraphText", {
                spaceId: assistOS.space.id,
                documentId: this._document.id,
                paragraphId: this.paragraph.id,
                text: paragraphText
            });
        }
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
        let position = this.getParagraphPosition() + 1;
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
                            id: image.id,
                            isUploadedImage: image.isUploadedImage || false
                        },
                        dimensions: {
                            width: "",
                            height: ""
                        }
                    }
                });
                position++;
            }
            let chapterElement = this.element.closest("chapter-item");
            let chapterPresenter = chapterElement.webSkelPresenter;
            chapterPresenter.invalidate(chapterPresenter.refreshChapter);
        }
    }

    async deleteParagraph(_target) {
        await this.documentPresenter.stopTimer(true);
        await assistOS.callFlow("DeleteParagraph", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: this.chapter.id,
            paragraphId: this.paragraph.id
        });
        let chapterElement = this.element.closest("chapter-item");
        let chapterPresenter = chapterElement.webSkelPresenter;
        chapterPresenter.invalidate(chapterPresenter.refreshChapter);
    }

    switchParagraphArrows(mode) {
        /* if (this.hasAudio) {
             let audioIcon = this.element.querySelector('.audio-icon');
             if (mode === "on") {
                 audioIcon.classList.remove("hidden");
             } else {
                 audioIcon.classList.add("hidden");
             }
         }*/
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
        //const audioIcon = this.element.querySelector('.audio-icon');
        if (!this.hasAudio) {
            paragraphText.addEventListener('mouseup', this.boundUpdateIconDisplay);
            document.addEventListener('selectionchange', this.boundSelectionChangeHandler);
            document.addEventListener('mousedown', this.boundMouseDownAudioIconHandler);
        }
        /* audioIcon.addEventListener('mousedown', this.boundPreventSelectionChange);*/
    }

    focusOutHandler() {
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
            this.selectionText = this.element.querySelector('.paragraph-text').value;
            let ttsPopup = `<text-to-speech data-presenter= "select-personality-tts" data-chapter-id="${this.chapter.id}" data-paragraph-id="${this.paragraph.id}"></text-to-speech>`;
            this.element.insertAdjacentHTML('beforeend', ttsPopup);
            let controller = new AbortController();
            document.addEventListener("click", this.hideTTSPopup.bind(this, controller, _target), {signal: controller.signal});
            _target.setAttribute("data-local-action", "showTTSPopup on");
        }
    }

    hideTTSPopup(controller, arrow, event) {
        if (event.target.closest("text-to-speech") || event.target.tagName === "A") {
            return;
        }
        arrow.setAttribute("data-local-action", "showTTSPopup off");
        let popup = this.element.querySelector("text-to-speech");
        if (popup) {
            popup.remove();
        }
        controller.abort();
    };

    async resetTimer(paragraph, event) {
        paragraph.style.height = "auto";
        paragraph.style.height = paragraph.scrollHeight + 'px';
        if (paragraph.value.trim() === "" && event.key === "Backspace" && !this.deleted) {
            if (assistOS.space.currentParagraphId === this.paragraph.id) {
                this.documentPresenter.stopTimer(false);
                this.deleted = true;
                let currentParagraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
                await assistOS.callFlow("DeleteParagraph", {
                    spaceId: assistOS.space.id,
                    documentId: this._document.id,
                    chapterId: this.chapter.id,
                    paragraphId: this.paragraph.id
                });
                if (this.chapter.paragraphs.length > 0) {
                    if (currentParagraphIndex === 0) {
                        assistOS.space.currentParagraphId = this.chapter.paragraphs[0].id;
                    } else {
                        assistOS.space.currentParagraphId = this.chapter.paragraphs[currentParagraphIndex - 1].id;
                    }
                } else {
                    assistOS.space.currentParagraphId = null;
                }
                let chapterElement = this.element.closest("chapter-item");
                let chapterPresenter = chapterElement.webSkelPresenter;
                chapterPresenter.invalidate(chapterPresenter.refreshChapter);
            }
        } else {
            await this.documentPresenter.resetTimer();
        }
    }

    async copy(_target) {
        const paragraphText = this.element.querySelector('.paragraph-text')
        navigator.clipboard.writeText(paragraphText.value);
        const dropdownMenu = this.element.querySelector('.dropdown-menu');
        dropdownMenu.remove();
    }

    async copyImage() {
        try {
            const image = document.getElementById('myImage');
            const response = await fetch(image.src);
            const blob = await response.blob();
            const clipboardItem = new ClipboardItem({'image/png': blob});
            await navigator.clipboard.write([clipboardItem]);
            console.log('Image copied to clipboard');
        } catch (err) {
            console.error('Failed to copy image: ', err);
        }
    }

    async playParagraphAudio(_target) {
        let audioSection = this.element.querySelector('.paragraph-audio-section');
        let audio = this.element.querySelector('.paragraph-audio');
        if (this.paragraph.audio && !this.paragraph.audioConfig.toRegenerate) {
            audio.src = this.paragraph.audio.src
        } else {
            const loaderId = await assistOS.UI.showLoading();
            let cleanText = utilModule.findCommand(this.paragraph.text).remainingText;
            let arrayBufferAudio = (await assistOS.callFlow("TextToSpeech", {
                spaceId: assistOS.space.id,
                prompt: cleanText,
                voiceId: this.paragraph.audioConfig.voiceId,
                voiceConfigs: {
                    emotion: this.paragraph.audioConfig.emotion,
                    styleGuidance: this.paragraph.audioConfig.styleGuidance,
                    voiceGuidance: this.paragraph.audioConfig.voiceGuidance,
                    temperature: this.paragraph.audioConfig.temperature
                },
                modelName: "PlayHT2.0"
            })).data;
            let audioId = await spaceModule.addAudio(assistOS.space.id, arrayBufferAudio);
            let audioSrc = `spaces/audio/${assistOS.space.id}/${audioId}`;
            await documentModule.updateParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id, {
                src: audioSrc,
                id: audioId
            });
            if(this.paragraph.audioConfig.toRegenerate){
                this.paragraph.audioConfig.toRegenerate = false;
                await documentModule.updateParagraphAudioConfigs(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.audioConfig);
            }
            this.isPlaying = true;
            assistOS.UI.hideLoading(loaderId);
            this.invalidate(async () => {
                this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
            });
            return;
        }
        audio.load();
        audio.play();
        audioSection.classList.remove('hidden');
        audioSection.classList.add('flex');
        let controller = new AbortController();
        document.addEventListener("click", this.hideAudioElement.bind(this, controller, audio), {signal: controller.signal});
    }
    async deleteAudio(_target) {
        documentModule.updateParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id, null);
        this.invalidate(async () => {
            this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
        });
    }

    hideAudioElement(controller, audio, event) {
        if (event.target.closest(".paragraph-audio")) {
            return;
        }
        audio.pause();
        let audioSection = this.element.querySelector('.paragraph-audio-section');
        audioSection.classList.add('hidden');
        audioSection.classList.remove('flex');
        controller.abort();
        this.isPlaying = false;
    };

    async openParagraphDropdown(_target) {
        const generateDropdownMenu = () => {
            let baseDropdownMenuHTML =
                `<div class="dropdown-item" data-local-action="deleteParagraph">Delete</div>
                 <div class="dropdown-item" data-local-action="copy">Copy</div>
                 <div class="dropdown-item" data-local-action="openInsertImageModal">Insert Image</div> 
                 <div class="dropdown-item" data-local-action="showTTSPopup off">Text To Speech</div>`;
            let chapterElement = this.element.closest("chapter-item");
            let chapterPresenter = chapterElement.webSkelPresenter;
            if (chapterPresenter.chapter.paragraphs.length > 1) {
                baseDropdownMenuHTML = `
                <div class="dropdown-item" data-local-action="moveParagraph up">Move Up</div>
                <div class="dropdown-item" data-local-action="moveParagraph down">Move Down</div>` + baseDropdownMenuHTML;
            }
            if (this.paragraph.audioConfig) {
                baseDropdownMenuHTML += `<div class="dropdown-item" data-local-action="playParagraphAudio">Play Audio</div>`;
            }
            if (this.paragraph.audio) {
                baseDropdownMenuHTML += `<div class="dropdown-item" data-local-action="deleteAudio">Delete Audio</div>
                <div class="dropdown-item" data-local-action="downloadAudio">Download Audio</div>`;

            }
            let dropdownMenuHTML =
                `<div class="dropdown-menu">` +
                baseDropdownMenuHTML +
                `</div>`;

            const dropdownMenu = document.createElement('div');
            dropdownMenu.innerHTML = dropdownMenuHTML;
            return dropdownMenu;
        }

        const dropdownMenu = generateDropdownMenu();
        this.element.appendChild(dropdownMenu);

        const removeDropdown = () => {
            dropdownMenu.remove();
        }

        dropdownMenu.addEventListener('mouseleave', removeDropdown);
        dropdownMenu.focus();
    }
    downloadAudio(_target) {
          const link = document.createElement('a');
          link.href = this.paragraph.audio.src;
          link.download = 'audio.mp3';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
    }
}