import {unescapeHtmlEntities} from "../../../../imports.js";
import pluginUtils from "../../../../core/plugins/pluginUtils.js";
import selectionUtils from "../../pages/document-view-page/selectionUtils.js";
const documentModule = require("assistos").loadModule("document", {});
const spaceModule = require("assistos").loadModule("space", {});


export class ChapterItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this._document = this.documentPresenter._document;
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.refreshChapter = async () => {
            this.chapter = await this._document.refreshChapter(this._document.id, this.chapter.id);
        };
        this.addParagraphOrChapterOnKeyPress = this.addParagraphOrChapterOnKeyPress.bind(this);
        this.element.removeEventListener('keydown', this.addParagraphOrChapterOnKeyPress);
        this.element.addEventListener('keydown', this.addParagraphOrChapterOnKeyPress);
        this.titleId = `${this.chapter.id}_title`;
        this.titleClass = "chapter-title";
        this.boundHandleUserSelection = this.handleUserSelection.bind(this);
        this.boundCloseChapterComment = this.closeChapterComment.bind(this);
        this.invalidate(async () => {
            this.boundOnChapterUpdate = this.onChapterUpdate.bind(this);
            await assistOS.NotificationRouter.subscribeToDocument(this._document.id, this.chapter.id, this.boundOnChapterUpdate);
            await  assistOS.NotificationRouter.subscribeToDocument(this._document.id, this.titleId, this.boundHandleUserSelection);
        });
    }

    showChapterOptions(targetElement) {
        let hideMoveArrows = this._document.chapters.length === 1 ? "hide" : "show";
        let downloadVideoClass;
        let compileVideoClass;
        let deleteVideoClass;
        if(this.chapter.commands.compileVideo){
            if(this.chapter.commands.compileVideo.id){
                downloadVideoClass = "show";
                deleteVideoClass = "show";
                compileVideoClass = "hide";
            } else {
                downloadVideoClass = "hide";
                deleteVideoClass = "hide";
                compileVideoClass = "show";
            }
        } else {
            compileVideoClass = "show";
            downloadVideoClass = "hide";
            deleteVideoClass = "hide";
        }
        let chapterOptions = `<action-box-chapter data-move-arrows="${hideMoveArrows}" data-download-video="${downloadVideoClass}" data-compile-video="${compileVideoClass}" data-delete-video="${deleteVideoClass}"></action-box-chapter>`;
        targetElement.insertAdjacentHTML("afterbegin", chapterOptions);
        let controller = new AbortController();
        this.boundHideChapterOptions = this.hideChapterOptions.bind(this, controller);
        document.addEventListener('click', this.boundHideChapterOptions, {signal: controller.signal});
    }
    hideChapterOptions(controller, event) {
        controller.abort();
        let options = this.element.querySelector(`action-box-chapter`);
        if (options) {
            options.remove();
        }
    }
    async downloadCompiledVideo() {
        let videoURL = await spaceModule.getVideoURL(this.chapter.commands.compileVideo.id);
        const response = await fetch(videoURL);
        const blob = await response.blob();
        let chapterIndex = this._document.getChapterIndex(this.chapter.id);
        const link = document.createElement('a');
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = `chapter_${chapterIndex + 1}_${this.chapter.title}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    }

    async deleteCompiledVideo(){
        alert("TO BE DONE")
    }

    async compileChapterVideo(){
        alert("TO BE DONE")
    }

    async beforeRender() {
        this.chapterFontSize = assistOS.constants.fontSizeMap[localStorage.getItem("chapter-title-font-size")||"20px"]
        this.chapterFontFamily = assistOS.constants.fontFamilyMap[localStorage.getItem("document-font-family")||"Arial"];
        this.titleMetadata = this.element.variables["data-title-metadata"];
        this.chapterContent = "";
        let index = this._document.getChapterIndex(this.chapter.id);
        this.chapterNumber = index + 1;
        this.chapter.paragraphs.forEach((paragraph) => {
            this.chapterContent += `<paragraph-item data-local-action="editItem paragraph" data-presenter="paragraph-item" data-paragraph-id="${paragraph.id}" data-chapter-id="${this.chapter.id}"></paragraph-item>`;
        });
    }

    async insertNewParagraph(paragraphId, position) {
        let newParagraph = await documentModule.getParagraph(assistOS.space.id, paragraphId);
        this.chapter.paragraphs.splice(position, 0, newParagraph);
        let previousParagraphIndex = position - 1;
        if (previousParagraphIndex < 0) {
            previousParagraphIndex = 0;
        }
        let previousParagraphId = this.chapter.paragraphs[previousParagraphIndex].id;
        let previousParagraph = this.element.querySelector(`paragraph-item[data-paragraph-id="${previousParagraphId}"]`);
        if (!previousParagraph) {
            let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
            paragraphsContainer.insertAdjacentHTML("afterbegin", `<paragraph-item data-local-action="editItem paragraph" data-presenter="paragraph-item" data-metadata="paragraph nr. ${position + 1} with id ${newParagraph.id}" data-paragraph-id="${newParagraph.id}" data-chapter-id="${this.chapter.id}"></paragraph-item>`);
            return;
        }
        previousParagraph.insertAdjacentHTML("afterend", `<paragraph-item data-local-action="editItem paragraph" data-presenter="paragraph-item" data-metadata="paragraph nr. ${position + 1} with id ${newParagraph.id}" data-paragraph-id="${newParagraph.id}" data-chapter-id="${this.chapter.id}"></paragraph-item>`);
    }

    deleteParagraph(paragraphId) {
        this.chapter.paragraphs = this.chapter.paragraphs.filter(paragraph => paragraph.id !== paragraphId);
        let paragraph = this.element.querySelector(`paragraph-item[data-paragraph-id="${paragraphId}"]`);
        paragraph.remove();
    }

    changeParagraphOrder(paragraphId, position) {
        let paragraphs = this.chapter.paragraphs;
        let currentParagraphIndex = this.chapter.getParagraphIndex(paragraphId);
        if (currentParagraphIndex === -1 || position < 0 || position >= paragraphs.length) {
            throw new Error("Invalid paragraphId or position");
        }
        let [paragraph] = paragraphs.splice(currentParagraphIndex, 1);
        paragraphs.splice(position, 0, paragraph);

        // Update the DOM
        let paragraphElement = this.element.querySelector(`paragraph-item[data-paragraph-id="${paragraphId}"]`);
        let referenceElement = this.element.querySelectorAll("paragraph-item")[position];

        if (referenceElement) {
            referenceElement.insertAdjacentElement(position > currentParagraphIndex ? 'afterend' : 'beforebegin', paragraphElement);
        } else {
            this.element.appendChild(paragraphElement); // If moving to the last position
        }
    }

    async onChapterUpdate(data) {
        if (typeof data === "object") {
            if (data.operationType === "add") {
                await this.insertNewParagraph(data.paragraphId, data.position);
            }else if (data.operationType === "delete") {
                this.deleteParagraph(data.paragraphId);
            }else if (data.operationType === "swap") {
                this.changeParagraphOrder(data.paragraphId, data.swapParagraphId, data.direction);
            }
        } else {
            switch (data) {
                case "title": {
                    let chapter = await documentModule.getChapter(assistOS.space.id, this._document.id, this.chapter.id);
                    if (chapter.title !== this.chapter.title) {
                        this.chapter.title = chapter.title;
                        this.renderChapterTitle();
                    }
                    break;
                }
                case "commands": {
                    let chapter = await documentModule.getChapter(assistOS.space.id, this._document.id, this.chapter.id);
                    this.chapter.commands = chapter.commands;
                    break;
                }
                default: {
                    let chapterIndex = this._document.getChapterIndex(this.chapter.id);
                    console.error(`chapterItem index ${chapterIndex}: Unknown update type: ${data}`);
                    break;
                }
            }
        }
        this.documentPresenter.toggleEditingState(true);
    }

    async saveTitle(titleElement) {
        let titleText = assistOS.UI.sanitize(titleElement.value);
        if (titleText !== this.chapter.title && titleText !== "") {
            this.chapter.title = titleText;
            await documentModule.updateChapter(assistOS.space.id, this.chapter.id,
                titleText,  this.chapter.comments , this.chapter.commands);
        }
    }

    renderChapterTitle() {
        let chapterTitle = this.element.querySelector(".chapter-title");
        chapterTitle.value = unescapeHtmlEntities(this.chapter.title);
    }

    async afterRender() {
        let chapterPluginsIcons = this.element.querySelector(".chapter-plugins-icons");
        await pluginUtils.renderPluginIcons(chapterPluginsIcons,"chapter");

        if(this.currentPlugin){
            this.openPlugin("", "chapter", this.currentPlugin);
        }

        this.element.setAttribute("data-local-action", "highlightChapter");
        this.renderChapterTitle();
        this.chapterItem = this.element.querySelector(".chapter-item");
        if (this.chapter.id === assistOS.space.currentChapterId && !assistOS.space.currentParagraphId) {
            this.chapterItem.click();
        }
        this.changeChapterVisibility(true);

        let moveChapterUp = this.element.querySelector(".move-chapter-up");
        this.documentPresenter.attachTooltip(moveChapterUp,"Move Chapter Up");

        let moveChapterDown = this.element.querySelector(".move-chapter-down");
        this.documentPresenter.attachTooltip(moveChapterDown,"Move Chapter Down");

        let insertElements = this.element.querySelector(".add-elements");
        this.documentPresenter.attachTooltip(insertElements,"Insert Elements");

        let downloadAudio = this.element.querySelector(".download-audio");
        this.documentPresenter.attachTooltip(downloadAudio,"Download Audio");

        let downloadVideo = this.element.querySelector(".download-compiled-video");
        this.documentPresenter.attachTooltip(downloadVideo,"Download Compiled Video");

        let compileVideo = this.element.querySelector(".compile-chapter-video");
        this.documentPresenter.attachTooltip(compileVideo,"Compile Chapter Video");

        let deleteVideo = this.element.querySelector(".delete-compiled-video");
        this.documentPresenter.attachTooltip(deleteVideo,"Delete Compiled Video");

        let deleteChapter = this.element.querySelector(".delete-chapter");
        this.documentPresenter.attachTooltip(deleteChapter,"Delete Chapter");


    }

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
            await this.documentPresenter.addChapter("", "below");
            // Else, if only Ctrl + Enter is pressed, add a paragraph
        } else if (event.ctrlKey && !event.shiftKey && event.key === "Enter") {
            let position = this.chapter.paragraphs.length;
            if (assistOS.space.currentParagraphId) {
                position = this.chapter.getParagraphIndex(assistOS.space.currentParagraphId) + 1;
            }

            let paragraph = await documentModule.addParagraph(assistOS.space.id, this.chapter.id, "", null, null, position);
            assistOS.space.currentParagraphId = paragraph.id;
            await this.insertNewParagraph(assistOS.space.currentParagraphId, position);
        }
    }


    async highlightChapter() {
        assistOS.space.currentChapterId = this.chapter.id;
        this.switchButtonsDisplay(this.chapterItem, "on");
        let chapterHeaderContainer = this.element.querySelector('.chapter-title-container');
        chapterHeaderContainer.classList.add("highlighted-chapter");
        this.switchChapterToolbar("on");
    }

    async openPlugin(targetElement, type, pluginName) {
        let selectionItemId = `${this.chapter.id}_${pluginName}`;
        this.currentPlugin = pluginName;
        let context = {
            chapterId: this.chapter.id,
        }
        await pluginUtils.openPlugin(pluginName, type, context, this, selectionItemId);
    }

    async focusOutHandlerTitle(chapterTitle){
        this.focusOutHandler()
        chapterTitle.classList.remove("focused");
        await selectionUtils.deselectItem(this.titleId, this);
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

    menus = {
        "insert-document-element": `
                <div>
                    <list-item data-local-action="addChapter above" data-name="Add Chapter Above" data-highlight="light-highlight"></list-item>
                    <list-item data-local-action="addChapter below" data-name="Add Chapter Below" data-highlight="light-highlight"></list-item>
                </div>`,
        "paragraph-comment-menu": `<paragraph-comment-menu class="paragraph-comment-menu" data-presenter="paragraph-comment-modal"></paragraph-comment-menu>`,
        "delete-menu": `<div>
                            <list-item data-local-action="downloadAllAudio" data-name="Download All Audio" data-highlight="light-highlight"></list-item>
                            <list-item data-local-action="downloadCompiledVideo" data-name="Download Compiled Video" data-highlight="light-highlight"></list-item>
                        </div>`
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

    switchChapterToolbar(mode) {
        let toolbar = this.element.querySelector('.chapter-toolbar');
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

    focusOutHandler() {
        assistOS.space.currentChapterId = null;
        this.switchButtonsDisplay(this.chapterItem, "off");
        this.switchChapterToolbar("off");
        let chapterHeaderContainer = this.element.querySelector('.chapter-title-container');
        chapterHeaderContainer.classList.remove("highlighted-chapter");
    }

    switchButtonsDisplay(targetElement, mode) {
        let chapterIcons = this.element.querySelector('.chapter-icons');
        mode === "on" ? chapterIcons.style.visibility = "visible" : chapterIcons.style.visibility = "hidden";
    }

    async changeChapterDisplay(_target) {
        await this.documentPresenter.changeCurrentElement(this.chapterItem, this.focusOutHandler.bind(this));
        await this.highlightChapter(_target);
        if (!this.isVisible) {
            this.changeChapterVisibility(true);
        } else {
            this.changeChapterVisibility(false);
        }

    }

    changeChapterVisibility(isVisible) {
        this.isVisible = isVisible;
        if (!isVisible) {
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
        alert("TO BE DONE");
    }

    async showBackgroundAudio(){
        await assistOS.UI.showModal("chapter-background-audio", {"chapter-id": this.chapter.id});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async deleteChapter(_target) {
        let message = "Are you sure you want to delete this chapter?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (!confirmation) {
            return;
        }
        await documentModule.deleteChapter(assistOS.space.id, this._document.id, this.chapter.id);
        this.documentPresenter.deleteChapter(this.chapter.id);
    }

    openChapterComment(_target) {
        const chapterMenu = `<chapter-comment-menu data-presenter="chapter-comment-menu"></chapter-comment-menu>`;
        this.element.querySelector('.chapter-title-container')?.insertAdjacentHTML('beforeend', chapterMenu);
        document.addEventListener('click', this.boundCloseChapterComment);
    }

    closeChapterComment(event) {
        if (event.target.closest('chapter-comment-menu')) {
            return;
        }
        document.removeEventListener('click', this.boundCloseChapterComment);
        this.element.querySelector('chapter-comment-menu')?.remove();
    }

    updateChapterNumber() {
        let chapterIndex = this._document.getChapterIndex(this.chapter.id);
        let chapterNumber = this.element.querySelector(".data-chapter-number");
        chapterNumber.innerHTML = `${chapterIndex + 1}.`;
    }
    async handleUserSelection(data){
        if(typeof data === "string"){
            return;
        }
        if(data.selected){
            await selectionUtils.setUserIcon(data.userImageId, data.userEmail, data.selectId, this.titleClass, this);
            if(data.lockOwner &&  data.lockOwner !== this.selectId){
                return selectionUtils.lockItem(this.titleClass, this);
            }
        } else {
            selectionUtils.removeUserIcon(data.selectId, this);
            if(!data.lockOwner){
                selectionUtils.unlockItem(this.titleClass, this);
            }
        }
    }
    async afterUnload(){
        if(this.selectionInterval){
            await selectionUtils.deselectItem(this.titleId, this);
        }
    }
}



