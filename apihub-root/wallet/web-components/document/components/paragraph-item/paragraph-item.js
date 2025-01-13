const documentModule = require("assistos").loadModule("document", {});
const spaceModule = require("assistos").loadModule("space", {});
import CommandsEditor from "./CommandsEditor.js";
import selectionUtils from "../../pages/document-view-page/selectionUtils.js";

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
        this.commandsEditor = new CommandsEditor(this._document.id, chapterId, this.paragraph, this);
        this.invalidate(this.subscribeToParagraphEvents.bind(this));
    }

    plugins = {
        "image-menu": {
            icon: `<div data-local-action="openPlugin image-menu" class="attachment-circle menu-container image-menu">
                    <img class="pointer" loading="lazy" src="./wallet/assets/icons/image.svg" alt="icon">
                </div>`
        },
        "diagram-menu": {
            icon: `<div data-local-action="openPlugin diagram-menu" class="attachment-circle menu-container diagram-menu">
                    <img class="pointer" loading="lazy" src="./wallet/assets/icons/diagram-logo.svg" alt="icon">
                </div>`
        },
        "audio-menu": {
            icon: `<div data-local-action="openPlugin audio-menu" class="attachment-circle menu-container audio-menu">
                    <img class="pointer" loading="lazy" src="./wallet/assets/icons/audio.svg" alt="icon">
                </div>`
        },
        "video-menu": {
            icon: `<div data-local-action="openPlugin video-menu" class="attachment-circle menu-container video-menu">
                    <img class="pointer" loading="lazy" src="./wallet/assets/icons/video.svg" alt="icon">
                </div>`
        },
        "text-menu": {
            icon: `<div data-local-action="openPlugin text-menu" class="attachment-circle menu-container text-menu">
                    <img class="pointer" loading="lazy" src="./wallet/assets/icons/light-bulb.svg" alt="icon">
                </div>`
        }
    }

    async subscribeToParagraphEvents() {
        this.boundOnParagraphUpdate = this.onParagraphUpdate.bind(this);
        await assistOS.NotificationRouter.subscribeToDocument(this._document.id, this.paragraph.id, this.boundOnParagraphUpdate);
        this.textClass = "paragraph-text";
        this.boundHandleUserSelection = this.handleUserSelection.bind(this, this.textClass);
        for (let pluginName of Object.keys(this.plugins)) {
            this.plugins[pluginName].boundHandleSelection = this.handleUserSelection.bind(this, pluginName);
            assistOS.NotificationRouter.subscribeToDocument(this._document.id, `${this.paragraph.id}_${pluginName}`, this.plugins[pluginName].boundHandleSelection);
        }
        await assistOS.NotificationRouter.subscribeToDocument(this._document.id, this.paragraph.id, this.boundHandleUserSelection);
        this.boundTaskStatusHandler = this.taskStatusHandler.bind(this);
        for (let [commandType, commandDetails] of Object.entries(this.paragraph.commands)) {
            for (let [key, value] of Object.entries(commandDetails)) {
                if (key === "taskId") {
                    assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, value, this.boundTaskStatusHandler);
                }
            }
        }
    }

    async beforeRender() {
        const textFontSize = localStorage.getItem("document-font-size")||16;
        const textFontFamily = localStorage.getItem("document-font-family")||"Arial";

        this.fontFamily= assistOS.constants.fontFamilyMap[textFontFamily]
        this.fontSize = assistOS.constants.fontSizeMap[textFontSize]

        this.loadedParagraphText = this.paragraph.text || "";

        this.pluginsIcons = "";
        for (let pluginName of Object.keys(this.plugins)) {
            this.pluginsIcons += this.plugins[pluginName].icon;
        }
        //this.decidePreviewType();
    }
    decidePreviewType() {
        if(this.paragraph.commands.video || this.paragraph.commands.audio || this.paragraph.commands.silence){
            this.previewComponent = `<paragraph-video-preview data-presenter="paragraph-video-preview"></paragraph-video-preview>`
        } else if(this.paragraph.commands.image){
            this.previewComponent = `<paragraph-image-preview data-presenter="paragraph-image-preview"></paragraph-image-preview>`
        } else if(this.isHMTLCode(this.paragraph.text)){
            this.previewComponent = `<paragraph-html-preview data-presenter="paragraph-html-preview"></paragraph-html-preview>`
        }
    }
    isHMTLCode(text){
        return text.includes("<") && text.includes(">");
    }
    async afterRender() {

        let paragraphContainer = this.element.querySelector(".paragraph-container");
        if (!paragraphContainer) {
            console.error("Nu s-a găsit .paragraph-container!");
            return;
        }

        let decodedText = await this.decodeHtmlEntities(this.paragraph.text);

        let parser = new DOMParser();
        let doc = parser.parseFromString(decodedText, "text/html");
        let tags = Array.from(doc.body.querySelectorAll("*"));

        if (tags.length > 0) {
            console.log("Length:", tags.length);

            let htmlString = tags.map(tag => {
                    let tempElement = document.createElement("div");
                    tempElement.innerHTML = tag.innerHTML;
                    let decodedContent = tempElement.textContent || tempElement.innerText || "";

                    return `<${tag.tagName.toLowerCase()}>${decodedContent}</${tag.tagName.toLowerCase()}>`;
                }).join("\n");

                paragraphContainer.insertAdjacentHTML("afterbegin", `
                <paragraph-html-preview data-presenter="paragraph-html-preview">
                </paragraph-html-preview>
                `);

                setTimeout(() => {
                    let previewElement = paragraphContainer.querySelector("paragraph-html-preview");
                    if (previewElement) {
                        previewElement.innerHTML += htmlString;
                        console.log(htmlString + 1112)
                    }
                }, 500);
        }

        let paragraphText = this.element.querySelector(".paragraph-text");
        paragraphText.innerHTML = this.paragraph.text
        paragraphText.style.height = paragraphText.scrollHeight + 'px';
        if (assistOS.space.currentParagraphId === this.paragraph.id) {
            paragraphText.click();
            //this.element.scrollIntoView({behavior: "smooth", block: "center"});
        }

        let commands = this.element.querySelector(".paragraph-commands");
        this.errorElement = this.element.querySelector(".error-message");
        commands.innerHTML = this.commandsEditor.buildCommandsHTML();
        if (commands.innerHTML !== "") {
            commands.style.padding = "5px 10px";
        }

        await this.updateCommands();
        let selected = this.documentPresenter.selectedParagraphs[this.paragraph.id];
        if (selected) {
            for (let selection of selected.users) {
                await selectionUtils.setUserIcon(selection.imageId, selection.selectId, this.textClass, this);
            }
            if (selected.lockOwner) {
                selectionUtils.lockItem(this.textClass, this);
            }
        }
        this.showStatusIcon();
    }

    async updateCommands() {
        let updateCommands;
        let commands = this.paragraph.commands;
        if (commands.effects) {
            for (let effect of commands.effects) {
                if(!effect.fadeIn){
                    effect.fadeIn = true;
                    updateCommands = true;
                }
            }
        }

        if (updateCommands) {
            await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
        }
    }
    showStatusIcon(){
        let unfinishedTasks = this.countUnfinishedTasks();
        let icon =""
        if (unfinishedTasks > 0) {
            icon = "info";
        }
        let commands = this.paragraph.commands;
        if (commands.video && commands.audio) {
            let videoDuration = commands.video.end - commands.video.start;
            if (commands.audio.duration > videoDuration) {
                icon = "warning";
            }
        }
        let statusIcon = this.element.querySelector(".status-icon");
        if(statusIcon){
            statusIcon.remove();
        }
        if(icon){
            let iconHTML = `<img loading="lazy" src="./wallet/assets/icons/${icon}.svg" class="status-icon" alt="${icon}">`;
            this.element.insertAdjacentHTML('beforeend', iconHTML);
        } else {
            let statusIcon = this.element.querySelector(".status-icon");
            if(statusIcon){
                statusIcon.remove();
            }
        }
    }
    checkVideoAndAudioDuration() {
        this.showStatusIcon();
        let commands = this.paragraph.commands;
        if (commands.video && commands.audio) {
            let videoDuration = commands.video.end - commands.video.start;
            if (commands.audio.duration > videoDuration) {
                let diff = commands.audio.duration - videoDuration;
                this.showParagraphWarning(`Audio is longer than the video by ${diff} seconds`);
            } else if (videoDuration - commands.audio.duration >= 0.1 ) {
                let diff = videoDuration - commands.audio.duration;
                this.showParagraphWarning(`Video is longer than the audio by ${diff} seconds`, async (event) => {
                    commands.video.end = commands.video.start + commands.audio.duration;
                    await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, commands);
                    this.checkVideoAndAudioDuration();
                    this.videoPresenter.setVideoPreviewDuration();
                }, "by cutting video");
            } else {
                this.hideParagraphWarning();
            }
        } else {
            this.hideParagraphWarning();
        }
    }

    async onParagraphUpdate(type) {
        if (type === "text") {
            this.paragraph.text = await documentModule.getParagraphText(assistOS.space.id, this._document.id, this.paragraph.id);
            this.hasExternalChanges = true;
            let paragraphText = this.element.querySelector(".paragraph-text");
            paragraphText.innerHTML = this.paragraph.text;

        } else if (type === "commands") {
            this.paragraph.commands = await documentModule.getParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id);
            this.commandsEditor.renderCommands();
        }
    }
    async deleteParagraph() {
        await this.documentPresenter.stopTimer(true);
        let message = "Are you sure you want to delete this paragraph?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (!confirmation) {
            return;
        }
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
        await chapterPresenter.invalidateCompiledVideo();
    }

    async moveParagraph(_target, direction) {
        if (this.chapter.paragraphs.length === 1) {
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
        await chapterPresenter.invalidateCompiledVideo();
    }

    addParagraph() {
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        let mockEvent = {
            ctrlKey: true,
            key: "Enter",
            target: this.element.querySelector(".paragraph-text-container")
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

    async decodeHtmlEntities(str) {
        const tempElement = document.createElement('div');
        tempElement.innerHTML = str;
        return tempElement.textContent || tempElement.innerText;
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
        if (commandsElement.tagName === "DIV") {
            await this.commandsEditor.renderEditModeCommands();
            let controller = new AbortController();
            document.addEventListener("click", (event) => {
                if (!event.target.closest(".paragraph-commands")) {
                    this.focusOutHandlerHeader(controller);
                }
            }, {signal: controller.signal});
        }

    }

    async highlightParagraph() {
        assistOS.space.currentParagraphId = this.paragraph.id;
        this.switchParagraphToolbar("on");
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.add("highlight-paragraph-header");
        let paragraphText = this.element.querySelector('.paragraph-text');
        paragraphText.classList.add("focused");
        let paragraphContainer = this.element.querySelector('.paragraph-container');
        paragraphContainer.classList.add("highlighted-paragraph");
        this.showUnfinishedTasks();
        this.checkVideoAndAudioDuration();
    }
    countUnfinishedTasks() {
        let unfinishedTasks = 0;
        for (let commandName of Object.keys(this.paragraph.commands)) {
            if (this.paragraph.commands[commandName].taskId) {
                unfinishedTasks++;
            }
        }
        return unfinishedTasks;
    }
    showUnfinishedTasks() {
        this.showStatusIcon();
        if (assistOS.space.currentParagraphId !== this.paragraph.id) {
            return;
        }
        let unfinishedTasks = this.countUnfinishedTasks();
        if (unfinishedTasks > 0) {
            this.showParagraphInfo(`${unfinishedTasks} tasks unfinished`);
        } else {
            this.hideParagraphInfo();
        }
    }

    async getPersonalityImageSrc(personalityName) {
        let personality = this.documentPresenter.personalitiesMetadata.find(personality => personality.name === personalityName);
        let personalityImageId;
        if (personality) {
            personalityImageId = personality.imageId;
        } else {
            personalityImageId = null;
            throw new Error("Personality not found");
        }
        if (personalityImageId) {
            return await spaceModule.getImageURL(personalityImageId);
        }
        return "./wallet/assets/images/default-personality.png"
    }

    async addUITask(taskId) {
        await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, taskId, this.boundTaskStatusHandler);
        this.documentPresenter.renderNewTasksBadge();
    }

    removeHighlightParagraph() {
        this.switchParagraphToolbar("off");
        let chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
        chapterPresenter.focusOutHandler();
        let paragraphContainer = this.element.querySelector('.paragraph-container');
        paragraphContainer.classList.remove("highlighted-paragraph");
        let paragraphHeaderContainer = this.element.querySelector('.paragraph-header');
        paragraphHeaderContainer.classList.remove("highlight-paragraph-header");
        this.hideParagraphInfo();
        this.hideParagraphWarning();
    }

    async focusOutHandler() {
        if (!this.element.closest("body")) {
            return;
        }
        await assistOS.loadifyComponent(this.element, async () => {
                this.removeHighlightParagraph();
                let paragraphText = this.element.querySelector(".paragraph-text");
                paragraphText.classList.remove("focused");
                const cachedText = assistOS.UI.customTrim(assistOS.UI.unsanitize(this.paragraph.text));
                const currentUIText = assistOS.UI.customTrim(paragraphText.value);
                const textChanged = assistOS.UI.normalizeSpaces(cachedText) !== assistOS.UI.normalizeSpaces(currentUIText);
                if (textChanged || this.textIsDifferentFromAudio) {
                    for (let command of Object.keys(this.paragraph.commands)) {
                        await this.commandsEditor.handleCommand(command, "changed");
                    }
                    await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id, this.paragraph.commands);
                    await this.saveParagraph(paragraphText);
                }
                this.textIsDifferentFromAudio = false;
                assistOS.space.currentParagraphId = null;
                await selectionUtils.deselectItem(this.paragraph.id, this);
            }
        );
    }

    async focusOutHandlerHeader(eventController) {
        await assistOS.loadifyComponent(this.element, async () => {
            await this.commandsEditor.saveCommands(eventController);
        });
    }

    async taskStatusHandler(status) {
        if (status === "completed") {
            this.paragraph.commands = await documentModule.getParagraphCommands(assistOS.space.id, this._document.id, this.paragraph.id);
            this.invalidate();
            this.videoPresenter.refreshVideoPreview();
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
                <div class="insert-document-element">
                    <list-item data-local-action="addParagraph" data-name="Insert Paragraph After" data-highlight="light-highlight"></list-item>
                    <list-item data-local-action="addChapter" data-name="Add Chapter" data-highlight="light-highlight"></list-item>
                    <list-item data-local-action="addParagraphTable" data-name="Add Paragraph Table" data-highlight="light-highlight"></list-item>
                </div>`,
        "paragraph-comment-menu": `<paragraph-comment-menu class="paragraph-comment-menu" data-presenter="paragraph-comment-modal"></paragraph-comment-menu>`,
    }

    async openPlugin(targetElement, pluginClass) {
        await selectionUtils.selectItem(true, `${this.paragraph.id}_${pluginClass}`, pluginClass, this);
        await assistOS.UI.showModal(pluginClass, {
            "chapter-id": this.chapter.id,
            "paragraph-id": this.paragraph.id
        }, true);
        await selectionUtils.deselectItem(`${this.paragraph.id}_${pluginClass}`, this);
    }

    openMenu(targetElement, menuName) {
        let menuOpen = this.element.querySelector(`.toolbar-menu.${menuName}`);
        if (menuOpen) {
            return;
        }

        let menuContent = this.menus[menuName];
        let menu = `<div class="toolbar-menu ${menuName}">${menuContent}</div>`
        targetElement.insertAdjacentHTML('beforeend', menu);
        let controller = new AbortController();
        let boundCloseMenu = this.closeMenu.bind(this, controller, targetElement, menuName);
        document.addEventListener("click", boundCloseMenu, {signal: controller.signal});
        let menuComponent = this.element.querySelector(`.${menuName}`);
        menuComponent.boundCloseMenu = boundCloseMenu;
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
    }

    changeMenuIcon(menuName, html) {
        let menuContainer = this.element.querySelector(`.menu-container.${menuName}`);
        menuContainer.innerHTML = html;
    }

    hideParagraphWarning() {
        let warningElement = this.element.querySelector(".paragraph-warning");
        if (warningElement) {
            warningElement.remove();
        }
    }

    showParagraphWarning(message, fixCb, fixMessage) {
        let warningElement = this.element.querySelector(".paragraph-warning");
        if (warningElement) {
            warningElement.remove();
        }
        let fixHTML = "";
        if (fixCb) {
            fixHTML = `<div class="fix-warning">fix this ${fixMessage}</div>`;
        }
        let warning = `
                <div class="paragraph-warning">
                    <img loading="lazy" src="./wallet/assets/icons/warning.svg" class="video-warning-icon" alt="warn">
                    <div class="warning-text">${message}</div>
                    ${fixHTML}
                </div>`;
        let paragraphHeader = this.element.querySelector(".header-section");
        paragraphHeader.insertAdjacentHTML('afterbegin', warning);
        if (fixCb) {
            let fixWarning = paragraphHeader.querySelector(".fix-warning");
            fixWarning.addEventListener("click", fixCb.bind(this), {once: true});
        }
    }

    hideParagraphInfo() {
        let tasksInfo = this.element.querySelector(".paragraph-info");
        if (tasksInfo) {
            tasksInfo.remove();
        }
    }

    showParagraphInfo(message) {
        let tasksInfo = this.element.querySelector(".paragraph-info");
        if (tasksInfo) {
            tasksInfo.remove();
        }
        let info = `
                <div class="paragraph-info">
                    <img loading="lazy" src="./wallet/assets/icons/info.svg" class="tasks-warning-icon" alt="info">
                    <div class="info-text">${message}</div>
                </div>`;
        let paragraphHeader = this.element.querySelector(".header-section");
        paragraphHeader.insertAdjacentHTML('beforeend', info);
    }

    async handleUserSelection(itemClass, data) {
        if (typeof data === "string") {
            return;
        }
        if (data.selected) {
            if (!this.plugins[itemClass]) {
                await selectionUtils.setUserIcon(data.imageId, data.selectId, itemClass, this);
            }
            if (data.lockOwner && data.lockOwner !== this.selectId) {
                return selectionUtils.lockItem(itemClass, this);
            }
        } else {
            if (!this.plugins[itemClass]) {
                selectionUtils.removeUserIcon(data.selectId, this);
            }

            if (!data.lockOwner) {
                selectionUtils.unlockItem(itemClass, this);
            }
        }
    }

    async afterUnload() {
        if (this.selectionInterval) {
            await selectionUtils.deselectItem(this.paragraph.id, this);
        }
    }
}
