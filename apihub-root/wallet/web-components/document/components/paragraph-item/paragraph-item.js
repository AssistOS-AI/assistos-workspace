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

        this.paragraphConfigs = utilModule.buildCommandsString(this.paragraph.commands);
        this.paragraphAttachments = this.buildAttachmentsHTML("view");
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
            //this.element.scrollIntoView({behavior: "smooth", block: "center"});
        }

        this.paragraphHeader = this.element.querySelector(".paragraph-commands");
        this.paragraphAtachments = this.element.querySelector(".paragraph-attachments");
        this.paragraphHeader.style.height = this.paragraphHeader.scrollHeight + 'px';
        let headerSection = this.element.querySelector(".header-sections");
        if (!this.boundResizeHeader) {
            this.boundResizeHeader = this.resizeHeader.bind(this, headerSection);
            this.paragraphHeader.addEventListener('input', this.boundResizeHeader);
        }
        this.errorElement = this.element.querySelector(".error-message");
        if (this.paragraph.commands.image) {
            this.setupImage();
        }
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

            } else if (type === "commands") {
                this.paragraph.commands = await documentModule.getParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id);
            }
        });
        for (let [commandType, commandDetails] of Object.entries(this.paragraph.commands)) {
            for (let [key, value] of Object.entries(commandDetails)) {
                if (key === "task") {
                    utilModule.subscribeToObject(value.id, async (status) => {
                        await this.changeTaskStatus(value.id, status);
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
        for (let [key, value] of Object.entries(this.paragraph.commands)) {
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


    resizeHeader(headerSection, event) {
        this.paragraphHeader.style.height = 'auto';
        this.paragraphHeader.style.height = this.paragraphHeader.scrollHeight + 'px';
        headerSection.style.height = headerSection.scrollHeight + 'px';
    }

    renderImageDimensions() {
        let originalWidth = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('width').replace('px', ''));
        let originalHeight = parseFloat(getComputedStyle(this.imgElement, null).getPropertyValue('height').replace('px', ''));
        const aspectRatio = originalWidth / originalHeight;
        const maxWidth = this.parentChapterElement.getBoundingClientRect().width - 78;
        const maxHeight = maxWidth / aspectRatio;
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

    async resetTimerImage(paragraph, event) {
        if (event.key === "Backspace") {
            if (assistOS.space.currentParagraphId === this.paragraph.id) {
                await this.documentPresenter.stopTimer(false);
                await this.deleteParagraphImage();
            }
        }
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
                this.paragraph.commands
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


    highlightParagraph() {
        this.switchParagraphArrows("on");
        assistOS.space.currentParagraphId = this.paragraph.id;
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.add("highlight-paragraph-header");
        let paragraphText = this.element.querySelector('.paragraph-text');
        paragraphText.classList.add("focused")
        this.paragraphHeader.removeAttribute('readonly');
        if (this.paragraph.commands.image) {
            this.imgContainer.classList.add("highlight-image");
        }
        this.renderEditModeCommands();
    }

    renderEditModeCommands() {
        let paragraphAttachments = this.element.querySelector('.paragraph-attachments');
        paragraphAttachments.remove();
        let textareaContainer = this.element.querySelector('.header-sections');
        let textareaValue = this.buildAttachmentsHTML("edit");
        textareaContainer.insertAdjacentHTML('afterbegin', `<textarea class="paragraph-attachments maintain-focus"></textarea>`);
        let attachmentsElement = this.element.querySelector('.paragraph-attachments');
        attachmentsElement.value = textareaValue;
        attachmentsElement.style.height = attachmentsElement.scrollHeight + 'px';
        attachmentsElement.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        this.paragraphAtachments = attachmentsElement;
    }

    buildAttachmentsHTML(mode) {
        let html = "";
        if (mode === "view") {
            for (let [commandType, commandDetails] of Object.entries(this.paragraph.commands)) {
                if (commandType === "image") {
                    let imageSrc = utilModule.constants.getImageSrc(assistOS.space.id, commandDetails.id);
                    html += `<a data-local-action="editItem link" href="${imageSrc}" class="tasks-info" data-id="${commandDetails.id}">Image</a>`;
                } else if (commandType === "audio") {
                    let audioSrc = utilModule.constants.getAudioSrc(assistOS.space.id, commandDetails.id);
                    html += `<a href="${audioSrc}" class="tasks-info" data-id="${commandDetails.id}">Audio</a>`;
                } else if (commandType === "video") {
                    let videoSrc = utilModule.constants.getVideoSrc(assistOS.space.id, commandDetails.id);
                    html += `<a href="${videoSrc}" class="tasks-info" data-id="${commandDetails.id}">Video</a>`;
                }

            }
        } else {
            let index = Object.keys(this.paragraph.commands).length;
            for (let [commandType, commandDetails] of Object.entries(this.paragraph.commands)) {
                index--;
                delete commandDetails.name
                if (commandType === "image") {
                    html += utilModule.buildCommandString(commandType, commandDetails);
                } else if (commandType === "audio") {
                    html += utilModule.buildCommandString(commandType, commandDetails);
                } else if (commandType === "video") {
                    html += utilModule.buildCommandString(commandType, commandDetails);
                }
                if (index > 0) {
                    html += "\n";
                }
            }
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
                    const taskId = await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME ==="lipsync").EXECUTE(assistOS.space.id, this._document.id, this.paragraph.id, {});
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

    async validateAttachment(attachmentType, resourceId) {
        return await utilModule.constants.COMMANDS_CONFIG.ATTACHMENTS.find(attachment => attachment.NAME === attachmentType)
            .VALIDATE(assistOS.space.id, resourceId, {});
    }

    async validateCommand(commandType, paragraph) {
        return await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === commandType)
            .VALIDATE(assistOS.space.id, paragraph, {});
    }

    renderViewModeCommands() {
        let paragraphAttachments = this.element.querySelector('.paragraph-attachments');
        paragraphAttachments.remove();
        let divText = this.buildAttachmentsHTML("view");
        let headerSection = this.element.querySelector('.header-sections');
        headerSection.insertAdjacentHTML('afterbegin', `<div class="paragraph-attachments maintain-focus">${divText}</div>`);
        paragraphAttachments = this.element.querySelector('.paragraph-attachments');
        paragraphAttachments.style.height = paragraphAttachments.scrollHeight + 'px';
        this.paragraphAtachments = paragraphAttachments;
    }

    getParagraphAttachmentsText() {
        return this.paragraphAtachments.tagName === "DIV" ?
            this.paragraphAtachments.innerText :
            this.paragraphAtachments.value;
    }

    async focusOutHandler() {
        await assistOS.loadifyComponent(
            this.element,
            async () => {
                this.switchParagraphArrows("off");
                let paragraphText = this.element.querySelector(".paragraph-text");
                paragraphText.classList.remove("focused");
                this.paragraphHeader.setAttribute('readonly', 'true');
                let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
                paragraphHeaderContainer.classList.remove("highlight-paragraph-header");
                let dragBorder = this.element.querySelector(".drag-border");
                dragBorder.style.display = "none";
                if (this.paragraph.commands.image) {
                    this.imgContainer.classList.remove("highlight-image");
                }
                const commands = utilModule.findCommands(this.paragraphHeader.value);

                if (commands.invalid) {
                    this.showCommandsError(commands.error);
                } else {
                    this.paragraphHeader.value = utilModule.buildCommandsString(commands);
                    const commandsDifferences = utilModule.getCommandsDifferences(this.paragraph.commands, commands);
                    const cachedText = assistOS.UI.customTrim(assistOS.UI.unsanitize(this.paragraph.text));
                    const currentUIText = assistOS.UI.customTrim(paragraphText.value);
                    const textChanged = assistOS.UI.normalizeSpaces(cachedText) !== assistOS.UI.normalizeSpaces(currentUIText);
                    if (textChanged) {
                        for (let [commandType, commandStatus] of Object.entries(commandsDifferences)) {
                            if (commandStatus !== "new") {
                                commandsDifferences[commandType] = "changed";
                            }
                        }
                    }
                    const attachments = utilModule.findAttachments(this.getParagraphAttachmentsText());
                    this.renderViewModeCommands();
                    if (attachments.invalid) {
                        this.showCommandsError(attachments.error);
                        return;
                    }
                    const attachmentsDifferences = utilModule.getAttachmentsDifferences(utilModule.getAttachmentsFromCommandsObject(this.paragraph.commands), attachments);
                    const existAttachmentsDifferences = Object.values(attachmentsDifferences).some(value => value !== "same");
                    const existCommandsDifferences = Object.values(commandsDifferences).some(value => value !== "same");

                    if (!existCommandsDifferences && !existAttachmentsDifferences) {
                        /* there is nothing further to do, and there are no syntax errors */
                        this.errorElement.innerText = "";
                        this.errorElement.classList.add("hidden");
                        return;
                    }
                    this.paragraph.commands = {...this.paragraph.commands, ...attachments};

                    if (existCommandsDifferences) {
                        if (Object.entries(this.paragraph.commands).length === 0) {
                            this.paragraph.commands = commands;
                        } else {
                            Object.entries(commandsDifferences).forEach(([commandName, commandState]) => {
                                if (commandState === "deleted") {
                                    delete this.paragraph.commands[commandName];
                                } else {
                                    /* command added,updated or same */
                                    if (!this.paragraph.commands[commandName]) {
                                        /* added */
                                        this.paragraph.commands[commandName] = {};
                                    }
                                    for (let [commandField, commandFieldValue] of Object.entries(commands[commandName])) {
                                        this.paragraph.commands[commandName][commandField] = commandFieldValue;
                                    }
                                }
                            });
                        }
                    }
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
                    for (const [attachmentType, attachmentStatus] of Object.entries(attachmentsDifferences)) {
                        try {
                            const resourceId = attachments[attachmentType].id;
                            await this.validateAttachment(attachmentType, resourceId);
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
                }
                await this.saveParagraph(paragraphText);
                assistOS.space.currentParagraphId = null;
            }
            );
    }

    focusOutHandlerImage(imageContainer) {
        this.renderViewModeCommands();
        this.switchParagraphArrows("off");
        let dragBorder = this.element.querySelector(".drag-border");
        dragBorder.style.display = "none";
        this.paragraphHeader.setAttribute('readonly', 'true');
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.remove("highlight-paragraph-header");
        let paragraphText = this.element.querySelector('.paragraph-text');
        paragraphText.classList.remove("focused");
        imageContainer.classList.remove("highlight-image");
    }


    async changeTaskStatus(taskId, status) {
        let taskLine = this.element.querySelector(`.task-line[data-id="${taskId}"]`);
        if (taskLine) {
            let taskStatus = taskLine.querySelector(".paragraph-task-status");
            taskStatus.innerText = `Status: ${status}`;
            if (status === "completed") {
                taskLine.classList.add("completed-task");
            }
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
        audio.src = utilModule.constants.getAudioSrc(assistOS.space.id, this.paragraph.commands.audio.id);
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
            if (this.paragraph.commands.image) {
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
            if (this.paragraph.commands.audio) {
                baseDropdownMenuHTML += `<list-item data-name="Play Audio" id="play-paragraph-audio-btn" data-local-action="playParagraphAudio" data-highlight="light-highlight"></list-item>`;
                baseDropdownMenuHTML += ` <list-item data-name="Download Audio" data-local-action="downloadAudio" data-highlight="light-highlight"></list-item>`;
                baseDropdownMenuHTML += ` <list-item data-name="Delete Audio" data-local-action="deleteAudio" data-highlight="light-highlight"></list-item>`;
            }

            if ( this.paragraph.commands.speech && !this.paragraph.commands.lipSync) {
                baseDropdownMenuHTML += `<list-item data-name="Generate Paragraph Video" data-local-action="addParagraphVideo" data-highlight="light-highlight"></list-item>`;
            }
            if (this.paragraph.commands.speech && this.paragraph.commands.image) {
                        baseDropdownMenuHTML += `<list-item data-name="Lip Sync" data-local-action="lipSync" data-highlight="light-highlight"></list-item>`;
            }
            if (this.paragraph.commands.lipSync) {
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
        link.href = utilModule.constants.getAudioSrc(assistOS.space.id, this.paragraph.commands.audio.id);
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
            <video controls autoplay class="lip-sync-video" src="${this.paragraph.commands.lipSync.src}"></video>
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
            this.paragraph.commands.image = imageData;
            await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
            this.invalidate();
        }
    }

    async deleteImage(_target) {
        delete this.paragraph.commands.image;
        await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
        this.invalidate();
    }

    async deleteAudio() {
        delete this.paragraph.commands.audio;
        await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
        this.invalidate();
    }
}
