import {BaseParagraph} from "../image-paragraph/BaseParagraph.js";

const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});


export class ParagraphItem extends BaseParagraph {
    constructor(element, invalidate) {
        super(element, invalidate);
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
                    if (this.audioGenerating === true) {
                        this.audioGenerating = false;
                    }
                }
            }
        });
    }

    beforeRender() {
        this.paragraphConfigs = "";
     /*   this.paragraph.config = {
            "!speech": {
                name: "!speech",
                paramsObject: {
                    personality: "Analyst",
                    emotion: "female_happy",
                    styleGuidance: 15,
                    temperature: 1,
                    voiceGuidance: 5
                }
            },
            "!silence": {
                name: "!silence",
                paramsObject: {
                    duration: 5
                },
            }
        }*/
        const commandCount = Object.keys(this.paragraph.config||{}).length
        Object.keys(this.paragraph.config||{}).forEach((key, index) => {
            this.paragraphConfigs += utilModule.buildCommandString(this.paragraph.config[key].name, this.paragraph.config[key].paramsObject);
            if (index !== commandCount - 1) {
                this.paragraphConfigs += `\n`;
            }
        })
    }

    afterRender() {
        let paragraphText = this.element.querySelector(".paragraph-text");
        paragraphText.innerHTML = this.paragraph.text
        paragraphText.style.height = paragraphText.scrollHeight + 'px';
        if (this.openTTSItem) {
            this.showTTSPopup(this.element, "off");
            this.openTTSItem = false;
        }

        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphText.click();
        }

        if (!this.boundPreventSelectionChange) {
            this.boundPreventSelectionChange = this.preventSelectionChange.bind(this);
        }
        this.paragraphHeader = this.element.querySelector(".paragraph-configs");
        this.paragraphHeader.style.height = this.paragraphHeader.scrollHeight + 'px';
        const paragraphTextArea = this.element.querySelector('.paragraph-text');
        this.paragraphHeader.addEventListener('click', () => paragraphTextArea.click());
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

    switchParagraphArrows(mode) {
        let arrows = this.element.querySelector('.paragraph-controls');
        if (mode === "on") {
            arrows.style.visibility = "visible";
        } else {
            arrows.style.visibility = "hidden";
        }
    }

    highlightParagraph() {
        this.switchParagraphArrows("on");
        assistOS.space.currentParagraphId = this.paragraph.id;
        this.paragraphHeader.removeAttribute('readonly');
        this.paragraphHeader.classList.add("highlight-paragraph-header")
        this.paragraphHeader.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }

    focusOutHandler() {
        this.switchParagraphArrows("off");
        this.paragraphHeader.setAttribute('readonly', 'true');
        this.paragraphHeader.classList.remove("highlight-paragraph-header")
        const commands= utilModule.findCommands(this.paragraphHeader.value);

        /*/!* We directly  extract the value as there can be synchronization issues with the setIntervel of saveParagraph fnc *!/
        const paragraphText = this.element.querySelector('.paragraph-text').value;
        const command = utilModule.findCommands(paragraphText);
        if ((command.action !== "textToSpeech" || assistOS.UI.customTrim(command.remainingText) === "") && this.currentParagraphCommand.action === "textToSpeech") {
            /!* was textToSpeech but no longer is -> delete audio *!/
            this.currentParagraphCommand = command;
            documentModule.updateParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id, null)
                .then(() => {
                    this.invalidate(async () => {
                        this.paragraph.audio = await documentModule.getParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id);
                    });
                });
        } else if (command.action === "textToSpeech" && assistOS.UI.customTrim(command.remainingText) !== "") {
            /!* generate TTS or update TTS *!/
            if (this.currentParagraphCommand.action !== "textToSpeech") {
                /!* we generate it *!/
                this.currentParagraphCommand = command;
                this.audioGenerating = true;
                documentModule.generateParagraphTTS(assistOS.space.id, this._document.id, this.paragraph.id, command).then(
                    () => {
                        this.audioGenerating = false;
                        this.invalidate(async () => {
                            this.paragraph.audio = await documentModule.getParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id);
                        });
                    }
                )
            } else {
                /!* check if we need to regenerate it *!/
                const commandDifferences = utilModule.isSameCommand(command, this.currentParagraphCommand);
                if (!commandDifferences.isEqual) {
                    /!* we regenerate it *!/
                    this.currentParagraphCommand = command;
                    this.audioGenerating = true;
                    documentModule.generateParagraphTTS(assistOS.space.id, this._document.id, this.paragraph.id, command).then(
                        () => {
                            this.audioGenerating = false;
                            this.invalidate(async () => {
                                this.paragraph.audio = await documentModule.getParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id);
                            });
                        }
                    )
                } else {
                    /!* do nothing *!/
                }
            }
        }*/
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
    }
    ;

    async resetTimer(paragraph, event) {
        paragraph.style.height = "auto";
        paragraph.style.height = paragraph.scrollHeight + 'px';
        if (paragraph.value.trim() === "" && event.key === "Backspace" && !this.deleted) {
            if (assistOS.space.currentParagraphId === this.paragraph.id) {
                this.documentPresenter.stopTimer(false);
                this.deleted = true;
                await this.deleteParagraph();
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
        audio.src = this.paragraph.audio.src
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
    }
    ;

    async openParagraphDropdown(_target) {
        const generateDropdownMenu = () => {
            let baseDropdownMenuHTML =
                `<list-item data-local-action="deleteParagraph" data-name="Delete"
                           data-highlight="light-highlight"></list-item>
                 <list-item data-local-action="copy" data-name="Copy"
                           data-highlight="light-highlight"></list-item>
                 <list-item data-local-action="openInsertImageModal" data-name="Insert Image"
                           data-highlight="light-highlight"></list-item>
                 <list-item data-local-action="addParagraph" data-name="Insert Paragraph" 
                           data-highlight="light-highlight"></list-item>
                 <list-item data-local-action="showTTSPopup off" data-name="Text To Speech"
                           data-highlight="light-highlight"></list-item>
                 `;
            let chapterElement = this.element.closest("chapter-item");
            let chapterPresenter = chapterElement.webSkelPresenter;
            if (chapterPresenter.chapter.paragraphs.length > 1) {
                baseDropdownMenuHTML = `
                <list-item data-local-action="moveParagraph up" data-name="Move Up" 
                           data-highlight="light-highlight"></list-item>
                <list-item data-local-action="moveParagraph down" data-name="Move Down" 
                           data-highlight="light-highlight"></list-item>` + baseDropdownMenuHTML;
            }
            if (this.paragraph.audio || this.audioGenerating) {
                if (this.audioGenerating) {
                    baseDropdownMenuHTML += `
                    <list-item  id="play-paragraph-audio-btn" data-name="Generating Audio..." 
                                              data-highlight="light-highlight"></list-item>`;
                } else {
                    baseDropdownMenuHTML += `<list-item data-name="Play Audio" id="play-paragraph-audio-btn" data-local-action="playParagraphAudio" data-highlight="light-highlight"></list-item>`;
                    baseDropdownMenuHTML += ` <list-item data-name="Download Audio" data-local-action="downloadAudio" data-highlight="light-highlight"></list-item>`;
                }
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
