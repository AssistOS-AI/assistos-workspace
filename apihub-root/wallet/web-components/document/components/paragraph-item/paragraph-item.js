const utilModule = require("assistos").loadModule("util", {});
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

    beforeRender() {
        this.paragraphCommands = this.buildCommandsHTML("view");
        this.loadedParagraphText = this.paragraph.text || "";
    }

    afterRender() {
        let paragraphText = this.element.querySelector(".paragraph-text");
        paragraphText.innerHTML = this.paragraph.text
        paragraphText.style.height = paragraphText.scrollHeight + 'px';

        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphText.click();
            //this.element.scrollIntoView({behavior: "smooth", block: "center"});
        }

        this.paragraphHeader = this.element.querySelector(".paragraph-commands");
        this.paragraphAtachments = this.element.querySelector(".paragraph-attachments");
        this.errorElement = this.element.querySelector(".error-message");
        if (this.paragraph.commands.image) {
            this.setupImage();
        }
        //for testing ONLY
        // if(this.paragraph.commands.audio){
        //     let audioTag = document.createElement("audio");
        //     audioTag.addEventListener("loadedmetadata", async () => {
        //         this.paragraph.commands.audio.duration = audioTag.duration;
        //         await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
        //         audioTag.remove();
        //     }, {once: true});
        //     audioTag.src = utilModule.constants.getAudioSrc(assistOS.space.id, this.paragraph.commands.audio.id);
        // }
    }

    async subscribeToParagraphEvents() {
        await utilModule.subscribeToObject(this.paragraph.id, async (type) => {
            if (type === "text") {
                this.paragraph.text = await documentModule.getParagraphText(assistOS.space.id, this._document.id, this.paragraph.id);
                this.hasExternalChanges = true;
                let paragraphText = this.element.querySelector(".paragraph-text");
                paragraphText.innerHTML = this.paragraph.text;

            } else if (type === "commands") {
                this.paragraph.commands = await documentModule.getParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id);
                let commandsElement = this.element.querySelector('.paragraph-commands');
                if(commandsElement.tagName === "DIV"){
                    this.renderViewModeCommands();
                } else {
                    this.renderEditModeCommands();
                }
            }
        });
        for (let [commandType, commandDetails] of Object.entries(this.paragraph.commands)) {
            for (let [key, value] of Object.entries(commandDetails)) {
                if (key === "taskId") {
                    utilModule.subscribeToObject(value, async (status) => {
                        await this.changeTaskStatus(value, status);
                    });
                }
            }
        }
        await this.prepareTaskIcon();
    }

    async prepareTaskIcon() {
        let speechCommand = this.paragraph.commands["speech"];
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
        let updateTasksMenu = false;
        try {
            await Promise.all(Object.entries(this.paragraph.commands)
                .map(async ([command, commandParams]) => {
                    if (commandParams.taskId) {
                        try {
                            utilModule.cancelTask(commandParams.taskId);
                        } catch (e) {
                            // task is not running
                        }
                        await utilModule.removeTask(commandParams.taskId);
                        updateTasksMenu = true;
                        return await utilModule.unsubscribeFromObject(commandParams.taskId);
                    }
                }));
        } catch (e) {
            //task not found (probably already deleted)
        }
        if (updateTasksMenu) {
            assistOS.space.notifyObservers(this._document.id + "/tasks");
        }
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
        this.deleted = true;
        this.element.remove();
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

    renderImageDimensions() {
        let originalWidth = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('width').replace('px', ''));
        let originalHeight = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('height').replace('px', ''));
        const aspectRatio = originalWidth / originalHeight;
        const maxWidth = Math.floor(this.parentChapterElement.getBoundingClientRect().width - 78);
        const maxHeight = Math.floor(maxWidth / aspectRatio);
        this.imgElement.style.width = maxWidth + 'px';
        this.imgElement.style.height = maxHeight + 'px';
        this.paragraph.commands.image.width = maxWidth;
        this.paragraph.commands.image.height = maxHeight;
        documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
    }

    setupImage() {
        let imgContainer = this.element.querySelector(".img-container");
        imgContainer.style.display = "flex";
        this.imgElement = this.element.querySelector(".paragraph-image");
        this.imgElement.addEventListener('load', this.renderImageDimensions.bind(this), {once: true});
        this.imgElement.src = utilModule.constants.getImageSrc(assistOS.space.id, this.paragraph.commands.image.id);
        this.imgContainer = this.element.querySelector('.img-container');
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

    async deleteParagraphImage() {
        if (!this.paragraph || !this.paragraph.commands.image || assistOS.space.currentParagraphId !== this.paragraph.id) {
            return;
        }
        delete this.paragraph.commands.image;
        await documentModule.updateParagraphCommands(
            assistOS.space.id,
            this._document.id,
            this.paragraph.id,
            this.paragraph.commands
        );
        this.invalidate();
    }

    async saveParagraphImage() {
        if (!this.paragraph || !this.paragraph.commands.image || assistOS.space.currentParagraphId !== this.paragraph.id) {
            await this.documentPresenter.stopTimer();
            return;
        }
        let imageElement = this.element.querySelector(".paragraph-image");
        let dimensions = {
            width: imageElement.width,
            height: imageElement.height
        };
        if ((dimensions.width !== this.paragraph.commands.image.width || dimensions.height !== this.paragraph.commands.image.height)) {
            this.paragraph.commands.image.width = dimensions.width;
            this.paragraph.commands.image.height = dimensions.height;
            await documentModule.updateParagraphCommands(
                assistOS.space.id,
                this._document.id,
                this.paragraph.id,
                this.paragraph.commands);
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
            this.paragraph.text = paragraphText
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

    highlightParagraphHeader() {
        assistOS.space.currentParagraphId = this.paragraph.id;
        this.switchParagraphArrows("on");
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.add("highlight-paragraph-header");
        this.paragraphHeader.removeAttribute('readonly');
        this.renderEditModeCommands();
        let paragraphText = this.element.querySelector('.paragraph-text');
        paragraphText.classList.add("focused")
        if (this.paragraph.commands.image) {
            this.imgContainer.classList.add("highlight-image");
        }
    }

    highlightParagraph() {
        assistOS.space.currentParagraphId = this.paragraph.id;
        this.switchParagraphArrows("on");
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.add("highlight-paragraph-header");
        let paragraphText = this.element.querySelector('.paragraph-text');
        paragraphText.classList.add("focused")
        if (this.paragraph.commands.image) {
            this.imgContainer.classList.add("highlight-image");
        }
    }

    renderEditModeCommands() {
        let textareaContainer = this.element.querySelector('.header-section');
        let commandsElement = this.element.querySelector('.paragraph-commands');
        commandsElement.remove();
        let commandsHTML = this.buildCommandsHTML("edit");
        textareaContainer.insertAdjacentHTML('beforeend', `<textarea class="paragraph-commands maintain-focus"></textarea>`);
        let paragraphCommands = this.element.querySelector('.paragraph-commands');
        paragraphCommands.value = commandsHTML;
        paragraphCommands.style.height = paragraphCommands.scrollHeight + 'px';
        paragraphCommands.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        this.paragraphHeader = paragraphCommands;
    }

    renderViewModeCommands() {
        let headerSection = this.element.querySelector('.header-section');
        let commandsElement = this.element.querySelector('.paragraph-commands');
        commandsElement.remove();
        let commandsHTML = this.buildCommandsHTML("view");
        headerSection.insertAdjacentHTML('beforeend', `<div class="paragraph-commands maintain-focus">${commandsHTML}</div>`);
        let paragraphHeader = this.element.querySelector('.paragraph-commands');
        paragraphHeader.style.height = "initial";
        this.paragraphHeader = paragraphHeader;
    }

    buildCommandsHTML(mode) {
        let html = "";
        if (mode === "view") {
            let commands = utilModule.getSortedCommandsArray(this.paragraph.commands);
            for (let command of commands) {
              if (command.name === "image") {
                    let imageSrc = utilModule.constants.getImageSrc(assistOS.space.id, command.id);
                    html += `<a data-local-action="showAttachment image" href="${imageSrc}" data-id="${command.id}">Image</a>`;
                } else if (command.name === "audio") {
                    let audioSrc = utilModule.constants.getAudioSrc(assistOS.space.id, command.id);
                    html += `<a data-local-action="showAttachment audio" href="${audioSrc}" data-id="${command.id}">Audio</a>`;
                } else if (command.name === "video") {
                    let videoSrc = utilModule.constants.getVideoSrc(assistOS.space.id, command.id);
                    html += `<a data-local-action="showAttachment video" href="${videoSrc}" data-id="${command.id}">Video</a>`;
                } else if (command.name === "speech") {
                    let personalityImageId = this.documentPresenter.personalitiesMetadata.find(personality => personality.name === command.personality).imageId;
                    let imageSrc = utilModule.constants.getImageSrc(assistOS.space.id, personalityImageId);
                    let speechHTML = `
                    <div class="command-line maintain-focus">
                        <img src="${imageSrc}" class="personality-icon" alt="personality">
                        <span class="personality-name">${command.personality}</span>
                        <span class="emotion">${utilModule.constants.COMMANDS_CONFIG.EMOTIONS[command.emotion]}</span>
                    </div>`;
                    html += speechHTML;
                } else if (command.name === "lipsync") {
                    let lipsyncHTML = `
                    <div class="command-line maintain-focus">
                        <span class="lipsync-text">Lipsync</span>
                    </div>`;
                    html += lipsyncHTML;
                } else if (command.name === "silence") {
                    let silenceHTML = `
                    <div class="command-line maintain-focus">
                        <img src="./wallet/assets/icons/silence.svg" class="command-icon" alt="silence">
                        <span class="silence-duration maintain-focus">${command.duration} sec</span>
                    </div>`;
                    html += silenceHTML;
                }
            }
        } else {
            html = utilModule.buildCommandsString(this.paragraph.commands);
        }
        return html;
    }

    showCommandsError(error) {
        if (this.errorElement.classList.contains("hidden")) {
            this.errorElement.classList.remove("hidden");
        }
        this.errorElement.innerText = error;
    }

    addUITask(taskId) {
        assistOS.space.notifyObservers(this._document.id + "/tasks");
        utilModule.subscribeToObject(taskId, async (status) => {
            await this.changeTaskStatus(taskId, status);
        });
        this.documentPresenter.renderNewTasksBadge();
    }

    async handleCommand(commandType, commandStatus, command) {
        const handleSpeechCommand = async (commandStatus, command) => {
            switch (commandStatus) {
                case "new":
                case "changed":
                    const taskId = await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "speech").EXECUTE(assistOS.space.id, this._document.id, this.paragraph.id, {});
                    this.addUITask(taskId);
                    break;
                case "deleted":
                case "same":
            }
        }
        const handleLipSyncCommand = async (commandStatus, command) => {
            switch (commandStatus) {
                case "new":
                    const taskId = await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "lipsync").EXECUTE(assistOS.space.id, this._document.id, this.paragraph.id, {});
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

    async validateCommand(commandType, paragraph) {
        return await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === commandType)
            .VALIDATE(assistOS.space.id, paragraph, {});
    }

    async focusOutHandler() {
        if (this.deleted) {
            return;
        }
        await assistOS.loadifyComponent(this.element, async () => {
                this.switchParagraphArrows("off");
                let paragraphText = this.element.querySelector(".paragraph-text");
                paragraphText.classList.remove("focused");
                if (this.paragraph.commands.image) {
                    this.imgContainer.classList.remove("highlight-image");
                }
                let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
                paragraphHeaderContainer.classList.remove("highlight-paragraph-header");
                const cachedText = assistOS.UI.customTrim(assistOS.UI.unsanitize(this.paragraph.text));
                const currentUIText = assistOS.UI.customTrim(paragraphText.value);
                const textChanged = assistOS.UI.normalizeSpaces(cachedText) !== assistOS.UI.normalizeSpaces(currentUIText);
                if (textChanged || this.textIsDifferentFromAudio) {
                    for (let command of Object.keys(this.paragraph.commands)) {
                        if (!this.paragraph.commands[command].taskId) {
                            await this.handleCommand(command, "changed", this.paragraph.commands[command]);
                        }
                    }
                }
                this.paragraph.commands = await documentModule.getParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id);
                this.textIsDifferentFromAudio = false;
                await this.saveParagraph(paragraphText);
                assistOS.space.currentParagraphId = null;
            }
        );
    }

    async focusOutHandlerHeader() {
        await assistOS.loadifyComponent(this.element, async () => {
            this.switchParagraphArrows("off");
            this.paragraphHeader.setAttribute('readonly', 'true');
            let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
            paragraphHeaderContainer.classList.remove("highlight-paragraph-header");
            let paragraphText = this.element.querySelector('.paragraph-text');
            paragraphText.classList.remove("focused");
            let commands = utilModule.findCommands(this.paragraphHeader.value);
            if (this.paragraph.commands.image) {
                this.imgContainer.classList.remove("highlight-image");
            }
            if (commands.invalid) {
                this.showCommandsError(commands.error);
            } else {
                this.paragraphHeader.value = utilModule.buildCommandsString(commands);
                const commandsDifferences = utilModule.getCommandsDifferences(this.paragraph.commands, commands);
                const existCommandsDifferences = Object.values(commandsDifferences).some(value => value !== "same");

                if (!existCommandsDifferences) {
                    /* there is nothing further to do, and there are no syntax errors */
                    this.errorElement.innerText = "";
                    this.errorElement.classList.add("hidden");
                    this.renderViewModeCommands();
                    return;
                }
                this.paragraph.commands = commands;
                let errorHandlingCommands = false;
                for (const [commandType, commandStatus] of Object.entries(commandsDifferences)) {
                    try {
                        await this.validateCommand(commandType, this.paragraph);
                    } catch (error) {
                        this.showCommandsError(error);
                        errorHandlingCommands = true;
                        break;
                    }
                }
                if (!errorHandlingCommands) {
                    this.errorElement.innerText = "";
                    this.errorElement.classList.add("hidden");
                    await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
                    for (let [commandType, commandStatus] of Object.entries(commandsDifferences)) {
                        await this.handleCommand(commandType, commandStatus, commands[commandType]);
                    }
                }
                this.renderViewModeCommands();
                if(this.paragraph.commands.image){
                    this.setupImage();
                }
            }
            assistOS.space.currentParagraphId = null;
        });
    }

    focusOutHandlerImage(imageContainer) {
        this.switchParagraphArrows("off");
        let dragBorder = this.element.querySelector(".drag-border");
        dragBorder.style.display = "none";
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.remove("highlight-paragraph-header");
        let paragraphText = this.element.querySelector('.paragraph-text');
        paragraphText.classList.remove("focused");
        imageContainer.classList.remove("highlight-image");
        assistOS.space.currentParagraphId = null;
    }

    async changeTaskStatus(taskId, status) {
        if (status === "completed") {
            this.paragraph.commands = await documentModule.getParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id);
            this.invalidate();
        }
    }

    showPopup(targetElement, mode) {
        if (mode === "off") {
            // let dropdownMenu = this.element.querySelector('.dropdown-menu');
            // if (dropdownMenu) {
            //     dropdownMenu.remove();
            // }
            let type = targetElement.getAttribute("data-type");
            let popup;
            let selector = "text-to-speech";
            if(type === "speech"){
                popup = `<text-to-speech data-presenter="text-to-speech" data-paragraph-id="${this.paragraph.id}"></text-to-speech>`;
            } else if(type === "silence"){
                selector = "silence-popup";
                popup = `<silence-popup data-presenter="silence-popup" data-paragraph-id="${this.paragraph.id}"></silence-popup>`;
            }
            this.element.insertAdjacentHTML('beforeend', popup);
            let controller = new AbortController();
            document.addEventListener("click", this.hidePopup.bind(this, controller, targetElement, selector), {signal: controller.signal});
            targetElement.setAttribute("data-local-action", "showPopup on");
        }
    }

    hidePopup(controller, targetElement, selector, event) {
        if (event.target.closest(selector) || event.target.tagName === "A") {
            return;
        }
        targetElement.setAttribute("data-local-action", "showPopup off");
        let popup = this.element.querySelector(selector);
        if (popup) {
            popup.remove();
        }
        controller.abort();
    }

    async resetTimer(paragraph, event) {
        paragraph.style.height = "auto";
        paragraph.style.height = paragraph.scrollHeight + 'px';
        await this.documentPresenter.resetTimer();
    }

    async cutParagraph(_target) {
        window.cutParagraph = this.paragraph;
        await this.deleteParagraph(_target);
        delete window.cutParagraph.id;
    }

    async pasteParagraph(_target) {
        window.cutParagraph.id= this.paragraph.id;
        await documentModule.updateParagraph(assistOS.space.id, this._document.id, this.paragraph.id, window.cutParagraph);
        delete window.cutParagraph;
        this.invalidate(async () => {
            this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
        });
    }

    async openParagraphDropdown(_target) {
        let chapterElement = this.element.closest("chapter-item");
        let chapterPresenter = chapterElement.webSkelPresenter;
        const generateDropdownMenu = () => {
            let baseDropdownMenuHTML =
                `<list-item data-local-action="deleteParagraph" data-name="Delete"
                           data-highlight="light-highlight"></list-item>
                 <list-item data-local-action="cutParagraph" data-name="Cut Paragraph"
                           data-highlight="light-highlight"></list-item>
                 <list-item data-local-action="addParagraph" data-name="Insert Paragraph" 
                           data-highlight="light-highlight"></list-item>
                 <list-item data-local-action="addChapter" data-name="Add Chapter"
                           data-highlight="light-highlight"></list-item>
                           
                 <list-item data-local-action="showPopup off" data-type="speech" data-name="Text To Speech"
                           data-highlight="light-highlight"></list-item>
                 <list-item data-local-action="showPopup off" data-type="silence" data-name="Insert Silence"
                           data-highlight="light-highlight"></list-item>
                 <list-item data-local-action="openInsertAttachmentModal audio" data-name="Insert Audio"
                           data-highlight="light-highlight"></list-item>
                 <list-item data-local-action="openInsertAttachmentModal image" data-name="Insert Image"
                           data-highlight="light-highlight"></list-item>
                 <list-item data-local-action="openInsertAttachmentModal video" data-name="Insert Video"
                           data-highlight="light-highlight"></list-item>
                 `;
            if (window.cutParagraph) {
                baseDropdownMenuHTML += `<list-item data-local-action="pasteParagraph" data-name="Paste Paragraph"
                           data-highlight="light-highlight"></list-item>`;
            }
            if (this.paragraph.commands.image) {
                baseDropdownMenuHTML += `
                <list-item data-local-action="deleteCommand image" data-name="Delete Image" 
                           data-highlight="light-highlight"></list-item>`;
            }
            if (chapterPresenter.chapter.paragraphs.length > 1) {
                baseDropdownMenuHTML = `
                <list-item data-local-action="moveParagraph up" data-name="Move Up" 
                           data-highlight="light-highlight"></list-item>
                <list-item data-local-action="moveParagraph down" data-name="Move Down" 
                           data-highlight="light-highlight"></list-item>` + baseDropdownMenuHTML;
            }
            if (this.paragraph.commands.audio) {
                baseDropdownMenuHTML += ` <list-item data-name="Delete Audio" data-local-action="deleteCommand audio" data-highlight="light-highlight"></list-item>`;
            }
            if (this.paragraph.commands.video) {
                baseDropdownMenuHTML += `<list-item data-name="Delete Video" data-local-action="deleteCommand video" data-highlight="light-highlight"></list-item>`;
            }
            if (this.paragraph.commands.speech && (this.paragraph.commands.image || this.paragraph.commands.video)) {
                baseDropdownMenuHTML += `<list-item data-name="Lip Sync" data-local-action="lipSync" data-highlight="light-highlight"></list-item>`;
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


    async lipSync(targetElement) {
        let commands = this.element.querySelector('.paragraph-commands');
        if (commands.tagName === "DIV") {
            this.paragraph.commands.lipsync = {};
            await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
            this.renderViewModeCommands();
        } else {
            const currentCommandsString = this.paragraphHeader.value.replace(/\n/g, "");
            this.paragraphHeader.value = `${currentCommandsString}` + "\n" + utilModule.buildCommandString("lipsync", {});
            this.paragraphHeader.style.height = this.paragraphHeader.scrollHeight + 'px';
        }
        let dropdownMenu = this.element.querySelector('.dropdown-menu');
        dropdownMenu.remove();
    }

    async openInsertAttachmentModal(_target, type) {
        let attachmentData = await assistOS.UI.showModal(`insert-${type}-modal`, true);
        if (attachmentData) {
            let commands = this.element.querySelector('.paragraph-commands');
            if (commands.tagName === "DIV") {
                this.paragraph.commands[type] = attachmentData;
                await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
                this.renderViewModeCommands();
                if(type === "image"){
                    this.setupImage();
                    let imageContainer = this.element.querySelector(".img-container");
                    imageContainer.classList.add("highlight-image");
                }
            } else {
                let commandString = utilModule.buildCommandString(type, attachmentData);
                commands.value += "\n" + commandString;
                commands.style.height = commands.scrollHeight + 'px';
            }
        }
    }

    async deleteCommand(_target, type) {
        let commands = this.element.querySelector('.paragraph-commands');
        if (commands.tagName === "DIV") {
            delete this.paragraph.commands[type];
            await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
            this.renderViewModeCommands();
            if(type === "image"){
                let imgContainer = this.element.querySelector(".img-container");
                imgContainer.style.display = "none";
            }
        } else {
            let currentCommands = utilModule.findCommands(commands.value);
            delete currentCommands[type];
            commands.value = utilModule.buildCommandsString(currentCommands);
            commands.style.height = commands.scrollHeight + 'px';
        }
    }

    async showAttachment(element, type) {
        await assistOS.UI.showModal("show-attachment-modal", {type: type, id: this.paragraph.commands[type].id});
    }
}
