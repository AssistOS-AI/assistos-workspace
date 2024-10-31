import {executorTimer} from "../../../../imports.js";
import {formatTime} from "../../../../utils/videoUtils.js";
import {NotificationRouter} from "../../../../imports.js";
const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});
const spaceModule = require("assistos").loadModule("space", {});
const blackScreen = "./wallet/assets/images/black-screen.png";

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
            this.boundOnParagraphUpdate = this.onParagraphUpdate.bind(this);
            await NotificationRouter.subscribeToDocument(this._document.id, this.paragraph.id, this.boundOnParagraphUpdate);
            this.boundChangeTaskStatus = this.changeTaskStatus.bind(this);
            for (let [commandType, commandDetails] of Object.entries(this.paragraph.commands)) {
                for (let [key, value] of Object.entries(commandDetails)) {
                    if (key === "taskId") {
                        NotificationRouter.subscribeToSpace(assistOS.space.id, value, this.boundChangeTaskStatus);
                    }
                }
            }
        });
    }

    async beforeRender() {
        this.loadedParagraphText = this.paragraph.text || "";
    }

    async afterRender() {
        this.initVideoElements();
        let paragraphText = this.element.querySelector(".paragraph-text");
        paragraphText.innerHTML = this.paragraph.text
        paragraphText.style.height = paragraphText.scrollHeight + 'px';

        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphText.click();
            //this.element.scrollIntoView({behavior: "smooth", block: "center"});
        }

        let commands = this.element.querySelector(".paragraph-commands");
        this.errorElement = this.element.querySelector(".error-message");
        commands.innerHTML = await this.buildCommandsHTML("view");
        if(commands.innerHTML !== ""){
            commands.style.padding = "5px 10px";
        }
        await this.setupVideoPreview();
    }

    async onParagraphUpdate(type) {
        if (type === "text") {
            this.paragraph.text = await documentModule.getParagraphText(assistOS.space.id, this._document.id, this.paragraph.id);
            this.hasExternalChanges = true;
            let paragraphText = this.element.querySelector(".paragraph-text");
            paragraphText.innerHTML = this.paragraph.text;

        } else if (type === "commands") {
            this.paragraph.commands = await documentModule.getParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id);
            let commandsElement = this.element.querySelector('.paragraph-commands');
            if(commandsElement.tagName === "DIV"){
                await this.renderViewModeCommands();
            } else {
                await this.renderEditModeCommands();
            }
        }
    }

    async deleteParagraph() {
        await this.documentPresenter.stopTimer(true);
        let currentParagraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);

        await documentModule.deleteParagraph(assistOS.space.id, this._document.id, this.chapter.id, this.paragraph.id);
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
        chapterPresenter.deleteParagraph(this.paragraph.id);
    }

    async moveParagraph(_target, direction) {
        if(this.chapter.paragraphs.length === 1){
            return;
        }
        await this.documentPresenter.stopTimer(false);
        const currentParagraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
        const getAdjacentParagraphId = (index, paragraphs) => {
            if (direction === "up") {
                return index === 0 ? paragraphs[paragraphs.length - 1].id : paragraphs[index - 1].id;
            }
            return index === paragraphs.length - 1 ? paragraphs[0].id : paragraphs[index + 1].id;
        };
        const adjacentParagraphId = getAdjacentParagraphId(currentParagraphIndex, this.chapter.paragraphs);
        await documentModule.swapParagraphs(assistOS.space.id, this._document.id, this.chapter.id, this.paragraph.id, adjacentParagraphId, direction);
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        chapterPresenter.swapParagraphs(this.paragraph.id, adjacentParagraphId, direction);
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

    async saveParagraph(paragraph) {
        if (!this.paragraph || assistOS.space.currentParagraphId !== this.paragraph.id || !this.element.closest("body")) {
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
            await documentModule.updateParagraphText(assistOS.space.id, this._document.id, this.paragraph.id, paragraphText);
        }
    }

    switchParagraphToolbar(mode) {
        let toolbar = this.element.querySelector('.paragraph-toolbar');
        if (mode === "on") {
            toolbar.style.display = "flex";
            if (window.cutParagraph) {
                let pasteIcon = this.element.querySelector(".paste-icon");
                pasteIcon.classList.remove("hidden");
            }
        } else {
            toolbar.style.display = "none";
        }
    }

    async enterEditModeCommands() {
        let commandsElement = this.element.querySelector('.paragraph-commands');
        if(commandsElement.tagName === "DIV"){
            await this.renderEditModeCommands();
            let controller = new AbortController();
            document.addEventListener("click", (event) => {
                if (!event.target.closest(".paragraph-commands")) {
                    this.focusOutHandlerHeader(controller);
                }
            }, {signal: controller.signal});
        }

    }

    highlightParagraph() {
        assistOS.space.currentParagraphId = this.paragraph.id;
        this.switchParagraphToolbar("on");
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.add("highlight-paragraph-header");
        let paragraphText = this.element.querySelector('.paragraph-text');
        paragraphText.classList.add("focused");
        let paragraphTextContainer = this.element.querySelector('.paragraph-item');
        paragraphTextContainer.style.padding = "0 10px 10px 10px";
        paragraphTextContainer.classList.add("highlighted-paragraph");
        this.showUnfinishedTasks();
    }
    showUnfinishedTasks(){
        if(assistOS.space.currentParagraphId !== this.paragraph.id){
            return;
        }
        let unfinishedTasks = 0;
        for(let commandName of Object.keys(this.paragraph.commands)){
            if(this.paragraph.commands[commandName].taskId){
                unfinishedTasks++;
            }
        }
        if(unfinishedTasks > 0){
            this.showCommandsInfo(`${unfinishedTasks} tasks unfinished`);
        } else {
            let tasksInfo = this.element.querySelector(".commands-info");
            if(tasksInfo){
                tasksInfo.remove();
            }
        }
    }
    async renderEditModeCommands() {
        let textareaContainer = this.element.querySelector('.header-section');
        let commandsElement = this.element.querySelector('.paragraph-commands');
        commandsElement.remove();
        let commandsHTML = await this.buildCommandsHTML("edit");
        textareaContainer.insertAdjacentHTML('beforeend', `<textarea class="paragraph-commands"></textarea>`);
        let paragraphCommands = this.element.querySelector('.paragraph-commands');
        paragraphCommands.value = commandsHTML;
        paragraphCommands.style.padding = `5px 10px`;
        paragraphCommands.style.height = paragraphCommands.scrollHeight + 'px';
        paragraphCommands.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });

    }

    async renderViewModeCommands() {
        let headerSection = this.element.querySelector('.header-section');
        let commandsElement = this.element.querySelector('.paragraph-commands');
        commandsElement.remove();
        let commandsHTML = await this.buildCommandsHTML("view");
        headerSection.insertAdjacentHTML('beforeend', `<div class="paragraph-commands">${commandsHTML}</div>`);
        let paragraphHeader = this.element.querySelector('.paragraph-commands');
        paragraphHeader.style.height = "initial";
        if(paragraphHeader.innerHTML === ""){
            paragraphHeader.style.padding = "0";
        } else {
            paragraphHeader.style.padding = "5px 10px";
        }
    }

    async buildCommandsHTML(mode) {
        let html = "";
        if (mode === "view") {
            let commands = utilModule.getSortedCommandsArray(this.paragraph.commands);
            let allAttachmentHighlights = this.element.querySelectorAll(".attachment-circle");
            allAttachmentHighlights.forEach(attachment => {
                attachment.classList.remove("highlight-attachment");
            });
            for (let command of commands) {
              if (command.name === "image") {
                  let attachmentHighlight = this.element.querySelector(".attachment-circle.image");
                  attachmentHighlight.classList.add("highlight-attachment");
                } else if (command.name === "audio") {
                  let attachmentHighlight = this.element.querySelector(".attachment-circle.audio");
                  attachmentHighlight.classList.add("highlight-attachment");
                } else if (command.name === "video") {
                  let attachmentHighlight = this.element.querySelector(".attachment-circle.video");
                  attachmentHighlight.classList.add("highlight-attachment");
                } else if (command.name === "soundEffect") {
                    let soundEffectSrc = await spaceModule.getAudioURL(command.id);
                    html += `<a class="command-link" data-local-action="showAttachment soundEffect" href="${soundEffectSrc}" data-id="${command.id}">Sound Effect</a>`;
                }
              else if (command.name === "silence") {
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
    async getPersonalityImageSrc(personalityName) {
        let personality = this.documentPresenter.personalitiesMetadata.find(personality => personality.name === personalityName);
        let personalityImageId;
        if(personality){
            personalityImageId = personality.imageId;
        } else {
            personalityImageId = null;
            throw new Error("Personality not found");
        }
        if(personalityImageId){
            return await spaceModule.getImageURL(personalityImageId);
        }
        return "./wallet/assets/images/default-personality.png"
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

    async handleCommand(commandName, commandStatus) {
        /* TODO: get the attachments from a central point in constants instead of hardcoding them */
        let attachments = ["image", "audio", "video", "silence", "soundEffect"];
        if (attachments.includes(commandName)) {
            return;
        }
        if (commandStatus === "new") {
            const taskId = await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === commandName).EXECUTE(assistOS.space.id, this._document.id, this.paragraph.id, {});
            this.paragraph.commands[commandName].taskId = taskId;
            this.addUITask(taskId);
        } else if (commandStatus === "changed") {
            if (this.paragraph.commands[commandName].taskId) {
                //cancel the task so it can be re-executed, same if it was cancelled, failed, pending
                let taskId = this.paragraph.commands[commandName].taskId;
                try {
                    utilModule.cancelTask(taskId);
                } catch (e) {
                    // task is not running
                }
            } else {
                const taskId = await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === commandName).EXECUTE(assistOS.space.id, this._document.id, this.paragraph.id, {});
                this.paragraph.commands[commandName].taskId = taskId;
                this.addUITask(taskId);
            }
        } else if (commandStatus === "deleted") {
            await this.deleteTaskFromCommand(commandName);
        }
    }
    async deleteTaskFromCommand(commandName) {
        if (this.paragraph.commands[commandName].taskId) {
            let taskId = this.paragraph.commands[commandName].taskId;
            try {
                await utilModule.cancelTaskAndRemove(taskId);
                await utilModule.unsubscribeFromObject(taskId);
                assistOS.space.notifyObservers(this._document.id + "/tasks");
            } catch (e) {
                //task has already been removed
            }
        }
    }
    async validateCommand(commandType, commands) {
        let testParagraph = JSON.parse(JSON.stringify(this.paragraph));
        testParagraph.commands = commands;
        return await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === commandType)
            .VALIDATE(assistOS.space.id, testParagraph, {});
    }
    deselectParagraph() {
        this.switchParagraphToolbar("off");
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        chapterPresenter.focusOutHandler();
        let paragraphTextContainer = this.element.querySelector('.paragraph-item');
        paragraphTextContainer.classList.remove("highlighted-paragraph");
        paragraphTextContainer.style.padding= "0";
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.remove("highlight-paragraph-header");
        let tasksInfo = this.element.querySelector(".commands-info");
        if(tasksInfo){
            tasksInfo.remove();
        }
    }
    async focusOutHandler() {
        if (!this.element.closest("body")) {
            return;
        }
        await assistOS.loadifyComponent(this.element, async () => {
                this.deselectParagraph();
                let paragraphText = this.element.querySelector(".paragraph-text");
                paragraphText.classList.remove("focused");
                const cachedText = assistOS.UI.customTrim(assistOS.UI.unsanitize(this.paragraph.text));
                const currentUIText = assistOS.UI.customTrim(paragraphText.value);
                const textChanged = assistOS.UI.normalizeSpaces(cachedText) !== assistOS.UI.normalizeSpaces(currentUIText);
                if (textChanged || this.textIsDifferentFromAudio) {
                    for (let command of Object.keys(this.paragraph.commands)) {
                        await this.handleCommand(command, "changed");
                    }
                }
                await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
                this.textIsDifferentFromAudio = false;
                await this.saveParagraph(paragraphText);
                assistOS.space.currentParagraphId = null;
            }
        );
    }

    async focusOutHandlerHeader(eventController) {
        await assistOS.loadifyComponent(this.element, async () => {
            let commandsElement = this.element.querySelector('.paragraph-commands');
            let commands = utilModule.findCommands(commandsElement.value);
            if (commands.invalid) {
                this.showCommandsError(commands.error);
                return;
            }
            commandsElement.value = utilModule.buildCommandsString(commands);
            const commandsDifferences = utilModule.getCommandsDifferences(this.paragraph.commands, commands);
            const existCommandsDifferences = Object.values(commandsDifferences).some(value => value !== "same");

            if (!existCommandsDifferences) {
                /* there is nothing further to do, and there are no syntax errors */
                this.errorElement.innerText = "";
                this.errorElement.classList.add("hidden");
                await this.renderViewModeCommands();
                eventController.abort();
                return;
            }
            for (const [commandType, commandStatus] of Object.entries(commandsDifferences)) {
                try {
                    if(commandStatus === "deleted") {
                        continue;
                    }
                    await this.validateCommand(commandType, commands);
                } catch (error) {
                    this.showCommandsError(error);
                    return;
                }
            }
            eventController.abort();
            this.errorElement.innerText = "";
            this.errorElement.classList.add("hidden");
            for (let [commandName, commandStatus] of Object.entries(commandsDifferences)) {
                if(commandStatus === "changed" || commandStatus === "deleted"){
                    await this.handleCommand(commandName, commandStatus);
                }
            }
            this.paragraph.commands = commands;
            for (let [commandName, commandStatus] of Object.entries(commandsDifferences)) {
                if(commandStatus === "new"){
                    await this.handleCommand(commandName, commandStatus);
                }
            }
            await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
            await this.renderViewModeCommands();
            await this.setupVideoPreview();
            this.showUnfinishedTasks();
        });
    }

    async changeTaskStatus(taskId, status) {
        if (status === "completed") {
            this.paragraph.commands = await documentModule.getParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id);
            this.invalidate();
            this.showUnfinishedTasks();
        }
    }

    async resetTimer(paragraph, event) {
        paragraph.style.height = "auto";
        paragraph.style.height = paragraph.scrollHeight + 'px';
        await this.documentPresenter.resetTimer();
    }

    async cutParagraph(_target) {
        window.cutParagraph = this.paragraph;
        await this.deleteParagraph();
        delete window.cutParagraph.id;
    }

    async pasteParagraph(_target) {
        window.cutParagraph.id = this.paragraph.id;
        await documentModule.updateParagraph(assistOS.space.id, this._document.id, this.paragraph.id, window.cutParagraph);
        this.invalidate(async () => {
            this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
            delete window.cutParagraph;
        });
    }
    menus = {
        "insert-document-element": `
                <list-item data-local-action="addParagraph" data-name="Insert Paragraph After" data-highlight="light-highlight"></list-item>
                <list-item data-local-action="addChapter" data-name="Add Chapter" data-highlight="light-highlight"></list-item>`,
        "image-menu":`
                <image-menu data-presenter="image-menu"></image-menu>`,
        "audio-menu":`
                <audio-menu data-presenter="audio-menu"></audio-menu>`,
        "video-menu":`
                <video-menu data-presenter="video-menu"></video-menu>`,
    }
    openMenu(targetElement, menuName) {
        if(targetElement.hasAttribute("data-menu-open")){
            return;
        }
        targetElement.setAttribute("data-menu-open", "true");
        let menuContent = this.menus[menuName];
        let menu = `<div class="toolbar-menu ${menuName}">${menuContent}</div>`
        targetElement.insertAdjacentHTML('beforeend', menu);
        let controller = new AbortController();
        document.addEventListener("click", this.closeMenu.bind(this, controller, targetElement, menuName), {signal: controller.signal});
    }
    closeMenu(controller, targetElement, menuName, event) {
        if (event.target.closest(`.toolbar-menu.${menuName}`) || event.target.closest(".insert-modal")) {
            return;
        }
        let menu = this.element.querySelector(`.toolbar-menu.${menuName}`);
        if (menu) {
            menu.remove();
        }
        controller.abort();
        targetElement.removeAttribute("data-menu-open");
    }

    async openInsertAttachmentModal(targetElement, type) {
        let attachmentData = await assistOS.UI.showModal(`insert-${type.toLowerCase()}-modal`, true);
        if (attachmentData) {
            let commands = this.element.querySelector('.paragraph-commands');
            if (commands.tagName === "DIV") {
                this.paragraph.commands[type] = attachmentData;
                if (this.paragraph.commands.lipsync) {
                    await this.handleCommand("lipsync", "changed");
                }
                await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
                await this.renderViewModeCommands();
                await this.setupVideoPreview();
            } else {
                let commandString = utilModule.buildCommandString(type, attachmentData);
                commands.value += "\n" + commandString;
                commands.style.height = commands.scrollHeight + 'px';
            }
        }
    }

    async deleteCommand(targetElement, type) {
        let commands = this.element.querySelector('.paragraph-commands');
        if (commands.tagName === "DIV") {
            if(this.paragraph.commands[type].taskId){
                await this.deleteTaskFromCommand(type);
            }
            delete this.paragraph.commands[type];
            await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
            await this.renderViewModeCommands();
            await this.setupVideoPreview();
        } else {
            let currentCommands = utilModule.findCommands(commands.value);
            delete currentCommands[type];
            commands.value = utilModule.buildCommandsString(currentCommands);
            commands.style.height = commands.scrollHeight + 'px';
        }
        this.showUnfinishedTasks();
    }

    showControls() {
        let controls = this.element.querySelector(".controls-mask-paragraph");
        controls.style.display = "flex";
    }

    hideControls() {
        let controls = this.element.querySelector(".controls-mask-paragraph");
        controls.style.display = "none";
    }
    switchDisplayMode(targetElement) {
        let currentMode = targetElement.getAttribute("data-mode");
        if (currentMode === "minimized") {
            targetElement.setAttribute("data-mode", "fullscreen");
            this.videoContainer.classList.add("fullscreen-paragraph-video");
            let controls = this.element.querySelector(".controls-mask-paragraph");
            let timer = new executorTimer(() => {
                controls.style.display = "none";
                this.videoContainer.style.cursor = "none";
            }, 3000);
            timer.start();
            let boundHideControlsFullscreen = this.hideControlsFullscreen.bind(this, controls, timer);
            this.videoContainer.addEventListener("mousemove", boundHideControlsFullscreen);
            this.boundRemoveListeners = this.removeListeners.bind(this, timer, boundHideControlsFullscreen);
            targetElement.addEventListener("click", this.boundRemoveListeners);

        } else {
            targetElement.setAttribute("data-mode", "minimized");
            this.videoContainer.classList.remove("fullscreen-paragraph-video");
            targetElement.removeEventListener("click", this.boundRemoveListeners);
        }
    }
    hideControlsFullscreen(controls, timer, event) {
        this.videoContainer.style.cursor = "default";
        controls.style.display = "flex";
        timer.reset();
    }

    removeListeners(timer, boundHideControlsFullscreen, event) {
        timer.stop();
        this.videoContainer.removeEventListener("mousemove", boundHideControlsFullscreen);
    }
    initVideoElements() {
        this.videoContainer = this.element.querySelector('.video-container');
        this.playPauseContainer = this.element.querySelector('.play-pause-container');
        this.playPauseIcon = this.element.querySelector(".play-pause");
        this.videoElement = this.element.querySelector(".video-player");
        this.imgElement = this.element.querySelector(".paragraph-image");
        this.audioElement = this.element.querySelector(".audio-player");
        this.currentTimeElement = this.element.querySelector(".current-time");
        this.chapterAudioElement = this.element.querySelector(".chapter-audio");
        if (!this.boundShowControls) {
            this.boundShowControls = this.showControls.bind(this);
            this.boundHideControls = this.hideControls.bind(this);
        }
        this.videoContainer.addEventListener("mouseover", this.boundShowControls);
        this.videoContainer.addEventListener("mouseout", this.boundHideControls);
    }
    async playPause(targetElement) {
        let nextMode = targetElement.getAttribute("data-next-mode");
        if(nextMode === "play"){
            targetElement.setAttribute("data-next-mode", "pause");
            targetElement.src = "./wallet/assets/icons/pause.svg";
            await this.playVideoPreview();
        } if(nextMode === "resume"){
            targetElement.setAttribute("data-next-mode", "pause");
            targetElement.src = "./wallet/assets/icons/pause.svg";
            await this.resumeVideo();
        }else if(nextMode === "pause"){
            targetElement.setAttribute("data-next-mode", "resume");
            targetElement.src = "./wallet/assets/icons/play.svg";
            this.audioElement.pause();
            this.videoElement.pause();
            this.chapterAudioElement.pause();
            if(this.silenceInterval){
                clearInterval(this.silenceInterval);
                delete this.silenceInterval;
            }
        }
    }
    async resumeVideo(){
        if(this.chapterAudioStartTime > -1){
            this.chapterAudioElement.play();
        }
        if(this.paragraph.commands.video){
            if(this.paragraph.commands.audio){
                this.audioElement.play();
            }
            this.videoElement.play();
        }else if(this.paragraph.commands.audio){
            this.audioElement.play();
        } else if(this.paragraph.commands.silence){
            await this.playSilence(this.paragraph.commands.silence.duration);
        } else if(this.paragraph.commands.image){
            await this.playSilence(1);
        }
    }
    setupMediaPlayerEventListeners(mediaPlayer){
        let stopTimeUpdateController = new AbortController();
        mediaPlayer.addEventListener("timeupdate", () => {
            this.currentTimeElement.innerHTML = formatTime(mediaPlayer.currentTime);
        }, {signal: stopTimeUpdateController.signal});

        mediaPlayer.addEventListener("ended", () => {
            this.chapterAudioElement.pause();
            setTimeout(async () => {
                stopTimeUpdateController.abort();
                this.playPauseIcon.setAttribute("data-next-mode", "play");
                this.playPauseIcon.src = "./wallet/assets/icons/play.svg";
                this.currentTimeElement.innerHTML = formatTime(0);
                this.videoElement.classList.add("hidden");
                await this.setVideoThumbnail();
                this.videoElement.currentTime = 0;
                this.audioElement.currentTime = 0;
            }, 1000);
        }, {once: true});
    }
    playMediaSynchronously(mediaPlayers){
        let played = false;
        let readyCount = 0;
        const totalPlayers = mediaPlayers.length;
        for(let mediaPlayer of mediaPlayers){
            mediaPlayer.addEventListener("canplaythrough", () => {
                readyCount++;
                if (readyCount === totalPlayers && !played) {
                    played = true;
                    this.hideLoaderAttachment();
                    for (let mediaPlayer of mediaPlayers) {
                        mediaPlayer.play();
                    }
                }
            }, {once: true});
        }
    }
    async playMedia(mediaPlayers){
        this.showLoaderAttachment();
        if(this.chapterAudioStartTime > -1){
            await this.setChapterAudioTime();
            mediaPlayers.push(this.chapterAudioElement);
            this.playMediaSynchronously(mediaPlayers);
        }else {
            this.playMediaSynchronously(mediaPlayers);
        }
        for(let mediaPlayer of mediaPlayers){
            let id = mediaPlayer.getAttribute("data-id");
            if(id === "paragraph-video"){
                mediaPlayer.src = await spaceModule.getVideoURL(this.paragraph.commands.video.id);
            } else if(id === "paragraph-audio"){
                mediaPlayer.src = await spaceModule.getAudioURL(this.paragraph.commands.audio.id);
            } else if(id === "chapter-audio"){
                mediaPlayer.src = await spaceModule.getAudioURL(this.chapter.backgroundSound.id);
            }
            mediaPlayer.load();
        }
    }
    async setChapterAudioTime(){
        this.chapterAudioElement.addEventListener("loadedmetadata", () => {
            this.chapterAudioElement.currentTime = this.chapterAudioStartTime;
        });
        this.chapterAudioElement.src = await spaceModule.getAudioURL(this.chapter.backgroundSound.id);
        this.chapterAudioElement.pause();
        this.chapterAudioElement.volume = this.chapter.backgroundSound.volume;
    }
    showLoaderAttachment(){
        if (this.loaderTimeout) {
            return;
        }
        this.loaderTimeout = setTimeout(() => {
            this.playPauseIconSrc = this.playPauseIcon.src;
            this.playPauseNextMode = this.playPauseIcon.getAttribute("data-next-mode");
            this.playPauseContainer.innerHTML = `<div class="loading-icon"><div>`;
        }, 500);
    }
    hideLoaderAttachment(){
        clearTimeout(this.loaderTimeout);
        delete this.loaderTimeout;
        if(this.playPauseNextMode){
            this.playPauseContainer.innerHTML = `<img data-local-action="playPause" data-next-mode="${this.playPauseNextMode}" class="play-pause pointer" src="${this.playPauseIconSrc}" alt="playPause">`;
            this.playPauseIcon = this.element.querySelector(".play-pause");
            delete this.playPauseNextMode;
            delete this.playPauseIconSrc;
        }
    }
    getChapterAudioStartTime(){
        let totalDuration = 0;
        let paragraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
        for(let i = paragraphIndex - 1; i >= 0; i--){
            let paragraph = this.chapter.paragraphs[i];
            let paragraphVideoDuration = this.getVideoPreviewDuration(paragraph);
            totalDuration += paragraphVideoDuration;
        }
        let chapterAudioDuration = this.chapter.backgroundSound.duration;
        if(this.chapter.backgroundSound.loop){
            return totalDuration % chapterAudioDuration;
        } else if(chapterAudioDuration >= totalDuration){
            return totalDuration;
        } else {
            return -1;
        }
    }
    async playVideoPreview(){
        if(this.chapter.backgroundSound){
            this.chapterAudioStartTime = this.getChapterAudioStartTime();
        }
        if(this.paragraph.commands.video){
            this.videoElement.classList.remove("hidden");
            if(this.paragraph.commands.audio){
                if(this.paragraph.commands.video.duration >= this.paragraph.commands.audio.duration){
                    this.setupMediaPlayerEventListeners(this.videoElement);
                } else {
                    this.setupMediaPlayerEventListeners(this.audioElement);
                    this.videoElement.addEventListener("ended", () => {
                        this.videoElement.classList.add("hidden");
                        this.imgElement.src = blackScreen;
                    }, {once: true});
                }
                await this.playMedia([this.videoElement, this.audioElement]);
            } else {
                this.setupMediaPlayerEventListeners(this.videoElement);
                await this.playMedia([this.videoElement]);
            }
        } else if(this.paragraph.commands.audio){
            this.setupMediaPlayerEventListeners(this.audioElement);
            await this.playMedia([this.audioElement]);
        } else if(this.paragraph.commands.silence){
            await this.playSilence(this.paragraph.commands.silence.duration);
        } else if(this.paragraph.commands.image){
            //play chapter audio if it exists
            await this.playSilence(1);
        }
    }

    async playSilence(silenceDuration){
        if(!this.silenceElapsedTime){
            this.silenceElapsedTime = 0;
            if(this.chapterAudioStartTime > -1){
                await this.setChapterAudioTime();
            }
        }
        await this.playMedia([]);
        this.chapterAudioElement.play();
        this.silenceInterval = setInterval(() => {
            this.silenceElapsedTime += 1;
            this.currentTimeElement.innerHTML = formatTime(this.silenceElapsedTime);
            if(this.silenceElapsedTime === silenceDuration){
                this.chapterAudioElement.pause();
                setTimeout(() => {
                    clearInterval(this.silenceInterval);
                    delete this.silenceInterval;
                    delete this.silenceElapsedTime;
                    this.playPauseIcon.setAttribute("data-next-mode", "play");
                    this.playPauseIcon.src = "./wallet/assets/icons/play.svg";
                    this.currentTimeElement.innerHTML = formatTime(0);
                }, 1000);
            }
        }, 1000);
    }
    getVideoPreviewDuration(paragraph){
        if(paragraph.commands.video || paragraph.commands.audio){
            let audioDuration = paragraph.commands.audio ? paragraph.commands.audio.duration : 0;
            let videoDuration = paragraph.commands.video ? paragraph.commands.video.duration : 0;
            return Math.max(audioDuration, videoDuration);
        } else if(this.paragraph.commands.silence){
            return paragraph.commands.silence.duration;
        } else if(this.paragraph.commands.image){
            return 1;
        }
        return 0;
    }
    async setupVideoPreview() {
        let hasAttachment = this.paragraph.commands.image || this.paragraph.commands.video ||
            this.paragraph.commands.audio || this.paragraph.commands.silence;
        this.currentTime = 0;
        if(hasAttachment){
            this.videoContainer.style.display = "flex";
            let chapterNumber = this.element.querySelector(".chapter-number");
            let chapterIndex = this._document.getChapterIndex(this.chapter.id);
            chapterNumber.innerHTML = chapterIndex + 1;
            let paragraphNumber = this.element.querySelector(".paragraph-number");
            let paragraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
            paragraphNumber.innerHTML = paragraphIndex + 1;
            let videoDurationElement = this.element.querySelector(".video-duration");
            let duration = this.getVideoPreviewDuration(this.paragraph);
            videoDurationElement.innerHTML = formatTime(duration);
        } else {
            this.videoContainer.style.display = "none";
        }
        this.videoElement.classList.add("hidden");
        await this.setVideoThumbnail();

    }
    async setVideoThumbnail(){
        let imageSrc = blackScreen;
        if(this.paragraph.commands.video){
            if(this.paragraph.commands.video.thumbnailId){
                imageSrc = await spaceModule.getImageURL(this.paragraph.commands.video.thumbnailId);
            }
        }
        if(this.paragraph.commands.image && !this.paragraph.commands.video){
            imageSrc = await spaceModule.getImageURL(this.paragraph.commands.image.id);
        }
        this.imgElement.src = imageSrc;
    }
    showCommandsInfo(message){
        let tasksInfo = this.element.querySelector(".commands-info");
        if(tasksInfo){
            tasksInfo.remove();
        }
        let info = `
                <div class="commands-info">
                    <img loading="lazy" src="./wallet/assets/icons/info.svg" class="tasks-warning-icon">
                    <div class="info-text">${message}</div>
                </div>`;
        let paragraphHeader = this.element.querySelector(".header-section");
        paragraphHeader.insertAdjacentHTML('beforeend', info);
    }
}
