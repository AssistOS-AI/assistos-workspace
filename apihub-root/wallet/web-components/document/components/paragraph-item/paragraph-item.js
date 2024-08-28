import {BaseParagraph} from "../image-paragraph/BaseParagraph.js";

const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});
const llmModule = require("assistos").loadModule("llm", {});


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

            } else if (type === "config") {
                this.paragraph.config = await documentModule.getParagraphConfig(assistOS.space.id, this._document.id, this.paragraph.id);
            }
        });
    }

    beforeRender() {
        this.paragraphConfigs = "";
        const commandCount = Object.keys(this.paragraph.config.commands || {}).length
        Object.keys(this
            .paragraph
            .config
            .commands || {})
            .forEach((key, index) => {
                this.paragraphConfigs += utilModule.buildCommandString(this.paragraph.config.commands[key].name, this.paragraph.config.commands[key].paramsObject || {});
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
        this.errorElement = this.element.querySelector(".error-message");
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
        const commands = utilModule.findCommands(this.paragraphHeader.value);
        if (commands.invalid) {
            if (this.errorElement.classList.contains("hidden")) {
                this.errorElement.classList.remove("hidden");
            }
            this.errorElement.innerText = commands.error;
        } else {
            const commandsDifferences = utilModule.getCommandsDifferences(this.paragraph.config.commands, commands);
            const existDifferences = Object.values(commandsDifferences).some(value => value !== 0);
            if (!existDifferences) {
                return;
            }
            this.errorElement.innerText = "";
            this.errorElement.classList.add("hidden");

            const handleCommand = (commandType, commandStatus, command) => {
                switch (commandType) {
                    case "silence":
                        if (commandStatus === "same") {
                        }
                        if (commandStatus === "new") {
                        }
                        if (commandStatus === "deleted") {
                        }
                        if (commandStatus === "changed") {
                        }
                        break;
                    case "speech":
                        const paragraphText = this.element.querySelector('.paragraph-text').value;
                        if (commandStatus === "new" || commandStatus === "changed" || (commandStatus === "same" && assistOS.UI.customTrim(paragraphText) !== assistOS.UI.customTrim(this.paragraph.text))) {
                            documentModule.generateParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id, command, paragraphText).then(
                                () => {
                                    this.invalidate(async () => {
                                        this.paragraph.config = await documentModule.getParagraphConfig(assistOS.space.id, this._document.id, this.paragraph.id);
                                    });
                                }
                            )
                        }
                        if (commandStatus === "deleted") {
                            documentModule.deleteParagraphAudio(assistOS.space.id, this._document.id, this.paragraph.id).then(
                                () => {
                                    this.invalidate(async () => {
                                        this.paragraph.config = await documentModule.getParagraphConfig(assistOS.space.id, this._document.id, this.paragraph.id);
                                    });
                                }
                            )
                        }
                        break;
                    case "video":
                        if (commandStatus === "same") {
                        }
                        if (commandStatus === "new") {

                        }
                        if (commandStatus === "deleted") {

                        }
                        if (commandStatus === "changed") {
                        }
                        break;
                    case "lipsync":
                        if (commandStatus === "same") {
                        }
                        if (commandStatus === "new") {

                        }
                        if (commandStatus === "deleted") {

                        }
                        if (commandStatus === "changed") {
                        }
                        break;
                }

            }
            this.paragraph.config.commands = commands;
            documentModule.updateParagraphConfig(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.config).then(() => {
                    Object.entries(commandsDifferences).forEach(([commandType, commandStatus]) => {
                            handleCommand(commandType, commandStatus, commands[commandType]);
                        }
                    )
                }
            )
        }
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
        audio.src = this.paragraph.config.audio.src
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
            if (!this.paragraph.config.audio) {
                baseDropdownMenuHTML += `<list-item data-name="Lip Sync" data-local-action="lipSync" data-highlight="light-highlight"></list-item>`;
            }
            if (this.paragraph.config.lipSync) {
                baseDropdownMenuHTML += `<list-item data-name="Play Lip Sync" data-local-action="playLipSyncVideo" data-highlight="light-highlight"></list-item>`;
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
        link.href = this.paragraph.config.audio.src;
        link.download = 'audio.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async lipSync(targetElement) {
        let paragraphIndex = this.chapter.paragraphs.findIndex(paragraph => paragraph.id === this.paragraph.id);
        let previousParagraph = this.chapter.paragraphs[paragraphIndex - 1];
        if (!previousParagraph) {
            return await showApplicationError("Lip Sync Error", "No previous paragraph found to extract image from.");
        }
        if (!previousParagraph.config.image) {
            return await showApplicationError("Lip Sync Error", "No image found in the previous paragraph to lip sync to.");
        }

        const currentCommandsString = this.paragraphHeader.value
            .replace(/\n/g, "");
        const currentCommandsObj = utilModule.findCommands(currentCommandsString);

        if (currentCommandsObj.invalid === true) {
            const errorElement = this.element.querySelector(".error-message");
            if (errorElement.classList.contains("hidden")) {
                errorElement.classList.remove("hidden");
            }
            errorElement.innerText = currentCommandsObj.error;
        } else {
            /* valid command string */
            if (!currentCommandsObj["lipsync"]){
                /* !speech command does not exist -> append it */
                this.paragraphHeader.value = `${currentCommandsString}` + "\n" + utilModule.buildCommandString("lipsync", {})
            }
        }
        let dropdownMenu = this.element.querySelector('.dropdown-menu');
        dropdownMenu.remove();
    }

    changeLipSyncUIState() {
        let paragraphControls = this.element.querySelector('.paragraph-controls');
        if (this.lipSyncState === "generating") {
            paragraphControls.insertAdjacentHTML('beforeend', `<div class="loading-icon small top-margin"></div>`);
        } else if (this.lipSyncState === "done") {
            let playButton = this.element.querySelector('.play-lip-sync');
            playButton.style.display = "block";
        }
    }

    playLipSyncVideo(playButton) {
        let videoTagContainer = `
        <div class="video-container">
            <video controls autoplay class="lip-sync-video" src="${this.paragraph.config.lipSync.src}"></video>
            <img src="./wallet/assets/icons/x-mark.svg" data-local-action="closePlayer" class="close-player pointer" alt="close"/>
        </div>`;
        playButton.insertAdjacentHTML('afterend', videoTagContainer);
    }

    closePlayer() {
        let videoContainer = this.element.querySelector('.video-container');
        videoContainer.remove();
    }
}
