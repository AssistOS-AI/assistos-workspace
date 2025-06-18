import {unescapeHtmlEntities} from "../../../../imports.js";
import pluginUtils from "../../../../core/plugins/pluginUtils.js";
import UIUtils from "../../pages/document-view-page/UIUtils.js";
const documentModule = assistOS.loadModule("document");

export class ChapterItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this._document = this.documentPresenter._document;
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.chapters.find(chapter => chapter.id === chapterId);
        this.refreshChapter = async () => {
            this.chapter = await this.refreshChapter(this._document.id, this.chapter.id);
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
    async refreshChapter(documentId, chapterId) {
        const documentModule = assistOS.loadModule("document");
        const chapter = await documentModule.getChapter(assistOS.space.id, documentId, chapterId);
        let chapterIndex = this._document.chapters.findIndex(chapter => chapter.id === chapterId);
        if (chapterIndex !== -1) {
            this._document.chapters[chapterIndex] = new documentModule.Chapter(chapter);
            return this._document.chapters[chapterIndex];
        } else {
            console.warn(`${chapterId} not found`);
            return null;
        }
    }

    async beforeRender() {
        if (window.assistOS.stylePreferenceCache) {
            this.stylePreferences = window.assistOS.stylePreferenceCache
        } else {
            this.stylePreferences = await documentModule.getStylePreferences(assistOS.user.email);
        }
        this.chapterFontSize = assistOS.constants.fontSizeMap[this.stylePreferences["chapter-title-font-size"]]||"20px"
        this.chapterFontFamily = assistOS.constants.fontFamilyMap[this.stylePreferences["document-font-family"]]||"Arial";
        this.titleMetadata = this.element.variables["data-title-metadata"];
        this.chapterContent = "";
        let index = this._document.chapters.findIndex(chapter => chapter.id === this.chapter.id);
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

    async openCommentModal(){
        let comment = await assistOS.UI.showModal("add-comment", {}, true);
        if(comment !== undefined){
            this.chapter.comments.messages.push(comment)
            UIUtils.changeCommentIndicator(this.element, this.chapter.comments.messages);
            await documentModule.updateChapter(assistOS.space.id, this.chapter.id,
                this.chapter.title,
                this.chapter.commands,
                this.chapter.comments);
        }
    }
    async updateComments(comments) {
        this.chapter.comments.messages = comments;
        await documentModule.updateChapter(assistOS.space.id, this.chapter.id,
            this.chapter.title,
            this.chapter.commands,
            this.chapter.comments);
        if(this.chapter.comments.messages.length === 0){
            this.closeComments();
            UIUtils.changeCommentIndicator(this.element, this.chapter.comments.messages);
        }
    }
    showComments(iconContainer){
        assistOS.UI.createElement("comments-section", iconContainer, {
            comments: this.chapter.comments.messages,
            chapterId: this.chapter.id,
        })
    }
    closeComments(){
        let iconContainer = this.element.querySelector(".comment-icon-container");
        let commentsSection = iconContainer.querySelector("comments-section");
        commentsSection.remove();
    }

    changeParagraphOrder(paragraphId, position) {
        let paragraphs = this.chapter.paragraphs;
        let currentParagraphIndex = this.chapter.paragraphs.findIndex(paragraph => paragraph.id === paragraphId);
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
                    let chapterIndex = this._document.chapters.findIndex(chapter => chapter.id === this.chapter.id);
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
                titleText,  this.chapter.commands, this.chapter.comments);
        }
    }

    renderChapterTitle() {
        let chapterTitle = this.element.querySelector(".chapter-title");
        chapterTitle.value = unescapeHtmlEntities(this.chapter.title);
    }

    async afterRender() {
        let createParagraph = this.element.getAttribute("data-create-paragraph");
        if(createParagraph === "true"){
            this.element.removeAttribute("data-create-paragraph");
            await this.addParagraph("", "below");
        }
        let chapterPluginsIcons = this.element.querySelector(".chapter-plugins-icons");
        await pluginUtils.renderPluginIcons(chapterPluginsIcons,"chapter");

        if(this.currentPlugin){
            this.openPlugin("", "chapter", this.currentPlugin);
        }

        this.renderChapterTitle();
        if (this.chapter.id === assistOS.space.currentChapterId && !assistOS.space.currentParagraphId) {
            this.element.click();
        }
        this.displayChapterContent();

        let moveChapterUp = this.element.querySelector(".move-chapter-up");
        this.documentPresenter.attachTooltip(moveChapterUp,"Move Chapter Up");

        let moveChapterDown = this.element.querySelector(".move-chapter-down");
        this.documentPresenter.attachTooltip(moveChapterDown,"Move Chapter Down");

        let insertElements = this.element.querySelector(".add-elements");
        this.documentPresenter.attachTooltip(insertElements,"Insert Elements");

        let comments = this.element.querySelector(".comment-menu");
        this.documentPresenter.attachTooltip(comments,"Comments");

        let deleteChapter = this.element.querySelector(".delete-chapter");
        this.documentPresenter.attachTooltip(deleteChapter,"Delete Chapter");

        this.changeChapterDeleteAvailability();
        UIUtils.changeCommentIndicator(this.element, this.chapter.comments.messages);
        UIUtils.displayCurrentStatus(this.element, this.chapter.comments, "chapter");
        if(this.chapter.comments.pluginLastOpened){
            await this.openPlugin("", "chapter", this.chapter.comments.pluginLastOpened, true);
        }
    }

    async updateStatus(status, type, pluginName, autoPin) {
        UIUtils.changeStatusIcon(this.element, status, type, pluginName, autoPin);
        if(status === this.chapter.comments.status && pluginName === this.chapter.comments.plugin){
            return; // No change in status or plugin
        }
        this.chapter.comments.status = status;
        this.chapter.comments.plugin = pluginName;
        await documentModule.updateChapter(assistOS.space.id, this.chapter.id,
            this.chapter.title,
            this.chapter.commands,
            this.chapter.comments);
    }
    async updateLastOpenedPlugin(pluginName) {
        if (this.chapter.comments.pluginLastOpened === pluginName) {
            return; // No change in plugin
        }
        this.chapter.comments.pluginLastOpened = pluginName;
        await documentModule.updateChapter(assistOS.space.id, this.chapter.id,
            this.chapter.title,
            this.chapter.commands,
            this.chapter.comments);
    }
    changeChapterDeleteAvailability() {
        let deleteChapter = this.element.querySelector(".delete-chapter");
        if(this._document.chapters.length === 1){
            deleteChapter.classList.add("hidden");
        } else {
            deleteChapter.classList.remove("hidden");
        }
    }
    async addParagraph(_target, direction) {
        let position = this.chapter.paragraphs.length;
        if (assistOS.space.currentParagraphId) {
            position = this.chapter.paragraphs.findIndex(paragraph => paragraph.id === assistOS.space.currentParagraphId);
            if(direction === "above"){
                if(position < 0){
                    position = 0;
                }
            } else {
                position += 1;
            }
        }

        let paragraph = await documentModule.addParagraph(assistOS.space.id, this.chapter.id, "", null, null, position);
        assistOS.space.currentParagraphId = paragraph.id;
        await this.insertNewParagraph(assistOS.space.currentParagraphId, position);
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
            this.changeChapterDeleteAvailability();
            // Else, if only Ctrl + Enter is pressed, add a paragraph
        } else if (event.ctrlKey && !event.shiftKey && event.key === "Enter") {
            await this.addParagraph("", "below");
        }
    }


    async highlightChapter() {
        assistOS.space.currentChapterId = this.chapter.id;
        this.element.classList.add("highlighted-chapter");
    }
    async highlightChapterHeader() {
        this.switchChapterToolbar("on");
        let chapterHeader = this.element.querySelector(".chapter-header-container");
        chapterHeader.classList.add("highlighted-header");
        if(this.currentPlugin){
          await this.openPlugin("", "chapter", this.currentPlugin);
        }
    }

    async openPlugin(targetElement, type, pluginName, autoPin) {
        let pluginContainer = this.element.querySelector(`.${type}-plugin-container`);
        let pluginElement = pluginContainer.firstElementChild;
        if(pluginElement && pluginElement.tagName.toLowerCase() === pluginName){
            return;
        }
        let selectionItemId = `${this.chapter.id}_${pluginName}`;
        this.currentPlugin = pluginName;
        let context = {
            chapterId: this.chapter.id,
        }
        await pluginUtils.openPlugin(pluginName, type, context, this, selectionItemId, autoPin);
        await this.updateLastOpenedPlugin(pluginName);
    }
    async closePlugin(targetElement, focusoutClose) {
        delete this.currentPlugin;
        let pluginContainer = this.element.querySelector(`.chapter-plugin-container`);
        pluginContainer.classList.remove("plugin-open");
        let pluginElement = pluginContainer.firstElementChild;
        if(!pluginElement){
            return;
        }
        let pluginName = pluginElement.tagName.toLowerCase();
        pluginElement.remove();
        pluginUtils.removeHighlightPlugin("chapter", this);
        await this.updateLastOpenedPlugin("");
        if(focusoutClose){
            return pluginName;
        }
    }

    async focusOutHandlerTitle(chapterTitle){
        this.focusOutHandler()
        chapterTitle.classList.remove("focused");
        await UIUtils.deselectItem(this.titleId, this);
        let chapterHeader = this.element.querySelector(".chapter-header-container");
        chapterHeader.classList.remove("highlighted-header");
        let pluginContainer = this.element.querySelector(`.chapter-plugin-container`);
        let pluginElement = pluginContainer.firstElementChild;
        if(!pluginElement){
            return;
        }
        if(pluginElement.classList.contains("pinned")){
            return;
        }
        this.currentPlugin = await this.closePlugin("", true);
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
                    <list-item data-local-action="addParagraph" data-name="Add Paragraph" data-highlight="light-highlight"></list-item>
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
        this.switchChapterToolbar("off");
        this.element.classList.remove("highlighted-chapter");
    }

    async changeChapterDisplay(_target) {
        this.chapter.comments.collapsed = !this.chapter.comments.collapsed;
        this.displayChapterContent();
        await documentModule.updateChapter(assistOS.space.id, this.chapter.id,
            this.chapter.title,
            this.chapter.commands,
            this.chapter.comments);
    }

    displayChapterContent() {
        if (this.chapter.comments.collapsed) {
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
        let chapterIndex = this._document.chapters.findIndex(chapter => chapter.id === this.chapter.id);
        let chapterNumber = this.element.querySelector(".data-chapter-number");
        chapterNumber.innerHTML = `${chapterIndex + 1}.`;
    }
    async handleUserSelection(data){
        if(typeof data === "string"){
            return;
        }
        if(data.selected){
            await UIUtils.setUserIcon(data.userImageId, data.userEmail, data.selectId, this.titleClass, this);
            if(data.lockOwner &&  data.lockOwner !== this.selectId){
                return UIUtils.lockItem(this.titleClass, this);
            }
        } else {
            UIUtils.removeUserIcon(data.selectId, this);
            if(!data.lockOwner){
                UIUtils.unlockItem(this.titleClass, this);
            }
        }
    }
    async afterUnload(){
        if(this.selectionInterval){
            await UIUtils.deselectItem(this.titleId, this);
        }
    }
}



