const utilModule = require("assistos").loadModule("util", {});
const personalityModule = require("assistos").loadModule("personality", {});
const documentModule = require("assistos").loadModule("document", {});

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

            } else if (type === "config") {
                this.paragraph.config = await documentModule.getParagraphConfig(assistOS.space.id, this._document.id, this.paragraph.id);
            }
        });
        await this.prepareTaskIcon();
    }

    async prepareTaskIcon() {
        let speechCommand = this.paragraph.config.commands["speech"];
        if (speechCommand) {
            if (speechCommand.taskId) {
                let task = await utilModule.getTask(speechCommand.taskId);
                if (task.status === "running") {
                    this.taskIcon = `<div class="loading-icon small top-margin"></div>`;
                } else if (task.status === "completed") {
                    this.taskIcon = "";
                } else if (task.status === "failed") {
                    this.taskIcon = `<img src="./wallet/assets/icons/error.svg" class="error-icon" alt="error">`;
                } else if (task.status === "cancelled") {
                    this.taskIcon = "";
                }
            }
        }
    }

    async deleteParagraph(_target) {
        await this.documentPresenter.stopTimer(true);
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
        let updateTasksMenu = false;
        for (let [key, value] of Object.entries(this.paragraph.config.commands)) {
            for (let [innerKey, innerValue] of Object.entries(value)) {
                if (innerKey === "taskId") {
                    try {
                        utilModule.cancelTask(innerValue);
                    } catch (e) {
                        //task is not running
                    }
                    await utilModule.removeTask(innerValue);
                    await utilModule.unsubscribeFromObject(innerValue);
                    updateTasksMenu = true;
                }
            }
        }
        if (updateTasksMenu) {
            assistOS.space.notifyObservers(this._document.id + "/tasks");
        }
        chapterPresenter.invalidate(chapterPresenter.refreshChapter);
    }

    async moveParagraph(_target, direction) {
        await this.documentPresenter.stopTimer(false);
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
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        chapterPresenter.invalidate(chapterPresenter.refreshChapter);
    }

    addParagraph() {
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        let mockEvent = {
            ctrlKey: true,
            key: "Enter",
            target: this.element.querySelector(".paragraph-item")
        }
        chapterPresenter.addParagraphOrChapterOnKeyPress(mockEvent);
    }

    beforeRender() {
        this.paragraphConfigs = utilModule.buildCommandsString(this.paragraph.config.commands);
        this.loadedParagraphText = this.paragraph.text;
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
        this.errorElement = this.element.querySelector(".error-message");

        if (this.paragraph.config.image) {
            this.setupImage();
        }
    }

    renderImageMaxWidth() {
        if (this.paragraph.config.image.dimensions) {
            this.imgElement.style.width = this.paragraph.config.image.dimensions.width + "px";
            this.imgElement.style.height = this.paragraph.config.image.dimensions.height + "px";
            return;
        }
        let originalWidth = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('width').replace('px', ''));
        let originalHeight = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('height').replace('px', ''));
        const aspectRatio = originalWidth / originalHeight;
        const maxWidth = this.parentChapterElement.getBoundingClientRect().width - 78;
        const maxHeight = maxWidth / aspectRatio;
        this.imgElement.style.width = maxWidth + 'px';
        this.imgElement.style.height = maxHeight + 'px';
        this.paragraph.config.image.dimensions = {
            width: maxWidth,
            height: maxHeight
        };
        documentModule.updateParagraphConfig(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.config);
    }

    setupImage() {
        let imgContainer = this.element.querySelector(".img-container");
        imgContainer.style.display = "flex";
        this.imgElement = this.element.querySelector(".paragraph-image");
        this.imgElement.addEventListener('load', this.renderImageMaxWidth.bind(this), {once: true});
        this.imgElement.src = this.paragraph.config.image.src;
        this.imgElement.alt = this.paragraph.config.image.alt;
        this.imgContainer = this.element.querySelector('.img-container');
        let paragraphImage = this.element.querySelector(".paragraph-image");
        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphImage.click();
        }
        const handlesNames = ["ne", "se", "sw", "nw"];
        let handles = {};
        for (let handleName of handlesNames) {
            handles[handleName] = this.element.querySelector(`.${handleName}`);
        }
        this.originalWidth = 0;
        this.originalHeight = 0;
        this.originalX = 0;
        this.originalY = 0;
        this.originalMouseX = 0;
        this.originalMouseY = 0;
        if (!this.boundMouseDownFN) {
            this.boundMouseDownFN = this.mouseDownFn.bind(this);
            for (let key of Object.keys(handles)) {
                handles[key].addEventListener('mousedown', this.boundMouseDownFN);
            }
        }
        this.parentChapterElement = this.element.closest("chapter-item");
    }

    mouseDownFn(event) {
        event.preventDefault();
        this.originalWidth = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('width').replace('px', ''));
        this.originalHeight = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('height').replace('px', ''));
        this.originalX = this.imgContainer.getBoundingClientRect().left;
        this.originalY = this.imgContainer.getBoundingClientRect().top;
        this.originalMouseX = event.pageX;
        this.originalMouseY = event.pageY;
        this.boundResize = this.resize.bind(this);
        document.addEventListener('mousemove', this.boundResize);
        document.addEventListener('mouseup', this.stopResize.bind(this), {once: true});
    }

    async resize(e) {
        const aspectRatio = this.originalWidth / this.originalHeight;
        let width = this.originalWidth + (e.pageX - this.originalMouseX);
        let height = width / aspectRatio;

        const maxWidth = this.parentChapterElement.getBoundingClientRect().width - 78;
        if (width > maxWidth) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
        }
        if (width > 20 && height > 20) {
            this.imgElement.style.width = width + 'px';
            this.imgElement.style.height = height + 'px';
        }
        await this.documentPresenter.resetTimer();
    }

    async stopResize() {
        document.removeEventListener('mousemove', this.boundResize);
        await this.documentPresenter.stopTimer(true);
    }

    async resetTimerImage(paragraph, event) {
        if (event.key === "Backspace") {
            if (assistOS.space.currentParagraphId === this.paragraph.id) {
                await this.documentPresenter.stopTimer(false);
                await this.deleteParagraph();
            }
        }
    }

    async saveParagraphImage() {
        if (!this.paragraph || !this.paragraph.config.image || assistOS.space.currentParagraphId !== this.paragraph.id) {
            await this.documentPresenter.stopTimer();
            return;
        }
        let imageElement = this.element.querySelector(".paragraph-image");
        let dimensions = {
            width: imageElement.width,
            height: imageElement.height
        };
        if ((dimensions.width !== this.paragraph.config.image.dimensions.width || dimensions.height !== this.paragraph.config.image.dimensions.height)) {
            this.paragraph.config.image.dimensions.width = dimensions.width;
            this.paragraph.config.image.dimensions.height = dimensions.height;
            await documentModule.updateParagraphConfig(
                assistOS.space.id,
                this._document.id,
                this.paragraph.id,
                this.paragraph.config
            )
        }
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
            this.textIsDifferentFromAudio = true;
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

    highlightParagraphImage() {
        let dragBorder = this.element.querySelector(".drag-border");
        dragBorder.style.display = "block";
        this.switchParagraphArrows("on");
        assistOS.space.currentParagraphId = this.paragraph.id;
        this.paragraphHeader.removeAttribute('readonly');
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.add("highlight-paragraph-header");
        this.paragraphHeader.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        let paragraphText = this.element.querySelector('.paragraph-text');
        paragraphText.classList.add("highlight-paragraph");
        this.imgContainer.classList.add("highlight-image");
    }

    highlightParagraph() {
        this.switchParagraphArrows("on");
        assistOS.space.currentParagraphId = this.paragraph.id;
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.add("highlight-paragraph-header");
        this.paragraphHeader.removeAttribute('readonly');
        this.paragraphHeader.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        if (this.paragraph.config.image) {
            this.imgContainer.classList.add("highlight-image");
        }
    }

    showCommandsError(error) {
        if (this.errorElement.classList.contains("hidden")) {
            this.errorElement.classList.remove("hidden");
        }
        this.errorElement.innerText = error;
    }

    addUITask(taskId) {
        let statusElement = this.element.querySelector('.task-status-icon');
        statusElement.innerHTML = "";
        assistOS.space.notifyObservers(this._document.id + "/tasks");
        utilModule.subscribeToObject(taskId, async (status) => {
            await this.changeTaskStatus(taskId, status);
        });
    }

    async handleCommand(commandType, commandStatus, command) {
        const handleSpeechCommand = async (commandStatus, command) => {
            switch (commandStatus) {
                case "new":
                    const taskId = await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "speech").EXECUTE(assistOS.space.id, this._document.id, this.paragraph.id,{});
                    this.addUITask(taskId);
                    break;
                case "changed":
                case "deleted":
                case "same":
            }
        }
        const handleLipSyncCommand = async (commandStatus, command) => {
            switch (commandStatus) {
                case "new":
                    const taskId = await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "speech").EXECUTE(assistOS.space.id, this._document.id, this.paragraph.id,{});
                    this.addUITask(taskId);
                    break;
                case "changed":
                case "deleted":
                case "same":
            }

        }
        const handleVideoCommand = async (commandStatus, command) => {
            switch (commandStatus) {
                case "new":
                case "changed":
                case "deleted":
                case "same":
            }

        }
        const handleSilenceCommand = async (commandStatus, command) => {
            switch (commandStatus) {
                case "new":
                case "changed":
                case "deleted":
                case "same":
            }
        }

        switch (commandType) {
            case "speech":
                return await handleSpeechCommand(commandStatus, command);
            case "lipsync":
                return await handleLipSyncCommand(commandStatus, command);
            case "video":
                return await handleVideoCommand(commandStatus, command);
            case "silence":
                return await handleSilenceCommand(commandStatus, command);
        }

    }

    async validateCommand(commandType, commandStatus, command) {
        switch (commandType) {
            case "speech":
                return await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "speech").VALIDATE(assistOS.space.id, this._document.id, this.paragraph.id,{});
            case "video":
                return await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "video").VALIDATE(assistOS.space.id, this._document.id, this.paragraph.id, {});
            case "lipsync":
                return await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "lipsync").VALIDATE(assistOS.space.id, this._document.id, this.paragraph.id,{});
        }
    }

    async focusOutHandler() {
        this.switchParagraphArrows("off");
        this.paragraphHeader.setAttribute('readonly', 'true');
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.remove("highlight-paragraph-header");
        let dragBorder = this.element.querySelector(".drag-border");
        dragBorder.style.display = "none";
        if (this.paragraph.config.image) {
            this.imgContainer.classList.remove("highlight-image");
        }
        const commands = utilModule.findCommands(this.paragraphHeader.value);
        if (commands.invalid) {
            this.showCommandsError(commands.error);
        } else {
            this.paragraphHeader.value = utilModule.buildCommandsString(commands);
            const commandsDifferences = utilModule.getCommandsDifferences(this.paragraph.config.commands, commands);
            const textChanged = assistOS.UI.customTrim(this.loadedParagraphText) !== assistOS.UI.customTrim(this.paragraph.text);
            if (textChanged) {
                for (let [commandType, commandStatus] of Object.entries(commandsDifferences)) {
                    if (commandStatus !== "new") {
                        commandsDifferences[commandType] = "changed";
                    }
                }
            }
            const existDifferences = Object.values(commandsDifferences).some(value => value !== "same");
            if (!existDifferences) {
                return;
            }
            if (Object.entries(this.paragraph.config.commands).length === 0) {
                this.paragraph.config.commands = commands;
            } else {
                Object.entries(commandsDifferences).forEach(([commandName, commandState]) => {
                    if (commandState === "deleted") {
                        delete this.paragraph.config.commands[commandName];
                    } else {
                        /* command added,updated or same */
                        if (!this.paragraph.config.commands[commandName]) {
                            /* added */
                            this.paragraph.config.commands[commandName] = {};
                        }
                        for (let [commandField, commandFieldValue] of Object.entries(commands[commandName])) {
                            this.paragraph.config.commands[commandName][commandField] = commandFieldValue;
                        }
                    }
                });
            }
            await documentModule.updateParagraphConfig(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.config);
            let errorHandlingCommands = false;
            for (let [commandType, commandStatus] of Object.entries(commandsDifferences)) {
                try {
                    await this.validateCommand(commandType, commandStatus, commands[commandType]);
                } catch (error) {
                    this.showCommandsError(error);
                    errorHandlingCommands = true;
                    break;
                }
            }

            if (!errorHandlingCommands) {
                this.errorElement.innerText = "";
                this.errorElement.classList.add("hidden");
                for (let [commandType, commandStatus] of Object.entries(commandsDifferences)) {
                    await this.handleCommand(commandType, commandStatus, commands[commandType]);
                }
            }
        }
    }

    focusOutHandlerImage() {
        this.switchParagraphArrows("off");
        let dragBorder = this.element.querySelector(".drag-border");
        dragBorder.style.display = "none";
        this.paragraphHeader.setAttribute('readonly', 'true');
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.remove("highlight-paragraph-header");
        let paragraphText = this.element.querySelector('.paragraph-text');
        paragraphText.classList.remove("highlight-paragraph");
        this.imgContainer.classList.remove("highlight-image");
    }


    async changeTaskStatus(taskId, status) {
        let statusElement = this.element.querySelector('.task-status-icon');
        if (status === "running") {
            statusElement.innerHTML = `<div class="loading-icon small top-margin"></div>`;
        } else if (status === "completed") {
            statusElement.innerHTML = "";
            this.paragraph.config = await documentModule.getParagraphConfig(assistOS.space.id, this._document.id, this.paragraph.id);
            this.textIsDifferentFromAudio = false;
        } else if (status === "failed") {
            this.paragraph.config = await documentModule.getParagraphConfig(assistOS.space.id, this._document.id, this.paragraph.id);
            statusElement.innerHTML = `<img src="./wallet/assets/icons/error.svg" class="error-icon" alt="error">`;
        } else if (status === "cancelled") {
            statusElement.innerHTML = "";
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

    async openParagraphDropdown(_target) {

        let chapterElement = this.element.closest("chapter-item");
        let chapterPresenter = chapterElement.webSkelPresenter;

        const previousParagraphImage = () => {
            const currentParagraphPosition = chapterPresenter.chapter.paragraphs.findIndex(paragraph => paragraph.id === this.paragraph.id);
            if (currentParagraphPosition !== 0) {
                if (chapterPresenter.chapter.paragraphs[currentParagraphPosition - 1].config.image) {
                    return true;
                }
            }
            return false;
        }

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
                 <list-item data-local-action="addChapter" data-name="Add Chapter"
                           data-highlight="light-highlight"></list-item>
                 `;
            if (this.paragraph.config.image) {
                baseDropdownMenuHTML = `
                <list-item data-local-action="deleteImage" data-name="Delete Image" 
                           data-highlight="light-highlight"></list-item>` + baseDropdownMenuHTML;
            }
            if (chapterPresenter.chapter.paragraphs.length > 1) {
                baseDropdownMenuHTML = `
                <list-item data-local-action="moveParagraph up" data-name="Move Up" 
                           data-highlight="light-highlight"></list-item>
                <list-item data-local-action="moveParagraph down" data-name="Move Down" 
                           data-highlight="light-highlight"></list-item>` + baseDropdownMenuHTML;
            }
            if (this.paragraph.config.audio) {
                baseDropdownMenuHTML += `<list-item data-name="Play Audio" id="play-paragraph-audio-btn" data-local-action="playParagraphAudio" data-highlight="light-highlight"></list-item>`;
                baseDropdownMenuHTML += ` <list-item data-name="Download Audio" data-local-action="downloadAudio" data-highlight="light-highlight"></list-item>`;

            }

            if (previousParagraphImage() && this.paragraph.config.commands.speech && !this.paragraph.config.lipSync) {
                baseDropdownMenuHTML += `<list-item data-name="Generate Paragraph Video" data-local-action="addParagraphVideo" data-highlight="light-highlight"></list-item>`;
            }
            if (previousParagraphImage() && this.paragraph.config.commands.speech) {
                const currentParagraphPosition = chapterPresenter.chapter.paragraphs.findIndex(paragraph => paragraph.id === this.paragraph.id);
                if (currentParagraphPosition !== 0) {
                    if (chapterPresenter.chapter.paragraphs[currentParagraphPosition - 1].config.image) {
                        baseDropdownMenuHTML += `<list-item data-name="Lip Sync" data-local-action="lipSync" data-highlight="light-highlight"></list-item>`;
                    }
                }
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

        const
            dropdownMenu = generateDropdownMenu();
        this
            .element
            .appendChild(dropdownMenu);

        const
            removeDropdown = () => {
                dropdownMenu.remove();
            }

        dropdownMenu
            .addEventListener(
                'mouseleave'
                ,
                removeDropdown
            )
        ;
        dropdownMenu
            .focus();
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
            if (!currentCommandsObj["lipsync"]) {
                /* !speech command does not exist -> append it */
                this.paragraphHeader.value = `${currentCommandsString}` + "\n" + utilModule.buildCommandString("lipsync", {})
            }
        }
        let dropdownMenu = this.element.querySelector('.dropdown-menu');
        dropdownMenu.remove();
    }

    async addParagraphVideo(_target) {
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
            if (!currentCommandsObj["video"]) {
                this.paragraphHeader.value = this.paragraphHeader.value + "\n" + utilModule.buildCommandString("video", {})
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

    async openInsertImageModal(_target) {
        let imageData = await assistOS.UI.showModal("insert-image-modal", {["chapter-id"]: this.chapter.id}, true);
        if (imageData) {
            this.paragraph.config.image = imageData;
            await documentModule.updateParagraphConfig(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.config);
            this.invalidate();
        }
    }

    async deleteImage(_target) {
        delete this.paragraph.config.image;
        await documentModule.updateParagraphConfig(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.config);
        this.invalidate();
    }
}
