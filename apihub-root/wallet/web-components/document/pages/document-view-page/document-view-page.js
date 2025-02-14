const documentModule = require("assistos").loadModule("document", {});
const personalityModule = require("assistos").loadModule("personality", {});
const spaceModule = require("assistos").loadModule("space", {});
import {executorTimer, unescapeHtmlEntities} from "../../../../imports.js";
import selectionUtils from "./selectionUtils.js";
import pluginUtils from "../../../../core/plugins/pluginUtils.js";

export class DocumentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.boundCloseDocumentComment = this.closeDocumentComment.bind(this);
        this.invalidate(async () => {
            this._document = await documentModule.getDocument(assistOS.space.id, window.location.hash.split("/")[3]);
            this.boundOnDocumentUpdate = this.onDocumentUpdate.bind(this);
            assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, this._document.id, this.boundOnDocumentUpdate);
            this.personalitiesMetadata = await personalityModule.getPersonalitiesMetadata(assistOS.space.id);
            this.boundRefreshPersonalitiesMetadata = this.refreshPersonalitiesMetadata.bind(this);
            assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, "personalities", this.boundRefreshPersonalitiesMetadata);
            this.selectedParagraphs = await documentModule.getSelectedDocumentItems(assistOS.space.id, this._document.id);
            await this.initTitleAbstractSelection();
        });
    }

    async printDocument() {
        await assistOS.UI.showModal("print-document-modal", {id: this._document.id, title: this._document.title});
    }

    async initTitleAbstractSelection() {
        this.abstractClass = "document-abstract";
        this.titleClass = "document-title";
        this.abstractId = "abstract";
        this.titleId = "title";
        this.boundSelectAbstractHandler = this.handleUserSelection.bind(this, this.abstractClass);
        this.boundSelectTitleHandler = this.handleUserSelection.bind(this, this.titleClass);
        await assistOS.NotificationRouter.subscribeToDocument(this._document.id, this.abstractId, this.boundSelectAbstractHandler);
        await assistOS.NotificationRouter.subscribeToDocument(this._document.id, this.titleId, this.boundSelectTitleHandler);
    }

    async getPersonalityName(personalityId){
        let personality = this.personalitiesMetadata.find(personality => personality.id === personalityId);
        return personality.name;
    }
    async getPersonalityImageByName(personalityName) {
        let personality = this.personalitiesMetadata.find(personality => personality.name === personalityName);
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

    async refreshPersonalitiesMetadata() {
        this.personalitiesMetadata = await personalityModule.getPersonalitiesMetadata(assistOS.space.id);
    }

    async insertNewChapter(chapterId, position) {
        let newChapter = await documentModule.getChapter(assistOS.space.id, this._document.id, chapterId);
        this._document.chapters.splice(position, 0, newChapter);
        let previousChapterIndex = position - 1;
        if (previousChapterIndex < 0) {
            previousChapterIndex = 0;
        }
        let previousChapterId = this._document.chapters[previousChapterIndex].id;
        let previousChapter = this.element.querySelector(`chapter-item[data-chapter-id="${previousChapterId}"]`);
        if (!previousChapter) {
            let chapterContainer = this.element.querySelector(".chapters-container");
            chapterContainer.insertAdjacentHTML("afterbegin", `<chapter-item data-chapter-number="${position + 1}" data-chapter-id="${newChapter.id}" data-metadata="chapter nr. ${position + 1} with title ${newChapter.title} and id ${newChapter.id}" data-title-metadata="title of the current chapter" data-presenter="chapter-item"></chapter-item>`);
            return;
        }
        previousChapter.insertAdjacentHTML("afterend", `<chapter-item data-chapter-number="${position + 1}" data-chapter-id="${newChapter.id}" data-metadata="chapter nr. ${position + 1} with title ${newChapter.title} and id ${newChapter.id}" data-title-metadata="title of the current chapter" data-presenter="chapter-item"></chapter-item>`);
    }

    swapChapters(chapterId, swapChapterId, direction) {
        let chapters = this._document.chapters;
        let currentChapterIndex = this._document.getChapterIndex(chapterId);
        let adjacentChapterIndex = this._document.getChapterIndex(swapChapterId);

        let chapter1 = this.element.querySelector(`chapter-item[data-chapter-id="${chapterId}"]`);
        let chapter2 = this.element.querySelector(`chapter-item[data-chapter-id="${swapChapterId}"]`);
        if (direction === "up") {
            if (adjacentChapterIndex === this._document.chapters.length - 1) {
                chapters.push(chapters.shift());
                let newIndex = this._document.chapters.length;
                chapter1.setAttribute("data-chapter-number", newIndex);
                chapter2.insertAdjacentElement('afterend', chapter1);
            } else {
                [chapters[currentChapterIndex], chapters[adjacentChapterIndex]] = [chapters[adjacentChapterIndex], chapters[currentChapterIndex]];
                let newIndex = adjacentChapterIndex + 1;
                chapter1.setAttribute("data-chapter-number", newIndex);
                chapter2.insertAdjacentElement('beforebegin', chapter1);
            }
        } else {
            // Insert the current chapter after the adjacent one
            if (adjacentChapterIndex === 0) {
                chapters.unshift(chapters.pop());
                let newIndex = 1;
                chapter1.setAttribute("data-chapter-number", newIndex);
                chapter2.insertAdjacentElement('beforebegin', chapter1);
            } else {
                [chapters[currentChapterIndex], chapters[adjacentChapterIndex]] = [chapters[adjacentChapterIndex], chapters[currentChapterIndex]];
                let newIndex = adjacentChapterIndex + 1;
                chapter1.setAttribute("data-chapter-number", newIndex);
                chapter2.insertAdjacentElement('afterend', chapter1);
            }
        }
        let allChapters = this.element.querySelectorAll("chapter-item");
        for (let chapter of allChapters) {
            chapter.webSkelPresenter.updateChapterNumber();
        }
    }

    deleteChapter(chapterId) {
        let chapter = this.element.querySelector(`chapter-item[data-chapter-id="${chapterId}"]`);
        chapter.remove();
        this._document.chapters = this._document.chapters.filter((chapter) => chapter.id !== chapterId);
    }

    async onDocumentUpdate(data) {
        if (typeof data === "object") {
            if (data.operationType === "add") {
                await this.insertNewChapter(data.chapterId, data.position);
            } else if (data.operationType === "delete") {
                this.deleteChapter(data.chapterId);
            } else if (data.operationType === "swap") {
                this.swapChapters(data.chapterId, data.swapChapterId, data.direction);
            }
        } else {
            switch (data) {
                case "delete":
                    await this.openDocumentsPage();
                    alert("The document has been deleted");
                    break;
                case "title":
                    let title = await documentModule.getDocumentTitle(assistOS.space.id, this._document.id);
                    this._document.title = title;
                    this.renderDocumentTitle();
                    break;
                case "abstract":
                    let abstract = await documentModule.getDocumentAbstract(assistOS.space.id, this._document.id);
                    this._document.abstract = abstract;
                    this.renderAbstract();
                    break;
                default:
                    console.error("Document: Unknown update type ", data);
                    break;
            }
        }
        this.toggleEditingState(true);
    }

    async beforeRender() {
        this.documentFontSize = assistOS.constants.fontSizeMap[localStorage.getItem("document-title-font-size") || "24px"];
        this.documentFontFamily = assistOS.constants.fontFamilyMap[localStorage.getItem("document-font-family")] || "Arial";
        this.abstractFontFamily = this.documentFontFamily
        this.abstractFontSize = assistOS.constants.fontSizeMap[localStorage.getItem("abstract-font-size") || "16px"];
        this.chaptersContainer = "";
        this.docTitle = this._document.title;
        this.abstractText = this._document.abstract || "No abstract has been set or generated for this document";
        if (this._document.chapters.length > 0) {
            let iterator = 0;
            this._document.chapters.forEach((item) => {
                iterator++;
                this.chaptersContainer += `<chapter-item data-chapter-number="${iterator}" data-chapter-id="${item.id}" data-metadata="chapter nr. ${iterator} with title ${item.title} and id ${item.id}" data-title-metadata="title of the current chapter" data-presenter="chapter-item"></chapter-item>`;
            });
        }
        document.documentElement.style.setProperty('--document-font-color', localStorage.getItem("document-font-color") || "#000000");
    }

    renderDocumentTitle() {
        let documentTitle = this.element.querySelector(".document-title");
        documentTitle.value = unescapeHtmlEntities(this._document.title);
    }

    renderAbstract() {
        let abstract = this.element.querySelector(".document-abstract");
        abstract.innerHTML = this._document.abstract || "This document doesn't have any information about its content";
    }

    async afterRender() {
        let documentPluginsContainer = this.element.querySelector(".document-plugins-container");
        await pluginUtils.renderPluginIcons(documentPluginsContainer, "document");
        let abstractPluginsContainer = this.element.querySelector(".abstract-plugins-container");
        await pluginUtils.renderPluginIcons(abstractPluginsContainer, "abstract");
        this.renderDocumentTitle();
        this.renderAbstract();
        if (assistOS.space.currentChapterId) {
            let chapter = this.element.querySelector(`chapter-item[data-chapter-id="${assistOS.space.currentChapterId}"]`);
            if (chapter) {
                chapter.click();
                chapter.scrollIntoView({behavior: "smooth", block: "center"});
            }
        }
        if (!this.boundRemoveFocusHandler) {
            this.boundRemoveFocusHandler = this.removeFocusHandler.bind(this);
            document.addEventListener("click", this.boundRemoveFocusHandler);
        }
        this.documentEditor = this.element.querySelector(".document-editor");
        this.disabledMask = this.element.querySelector(".disabled-mask");
        this.undoButton = this.element.querySelector(".undo-button");
        this.redoButton = this.element.querySelector(".redo-button");
        let tasksMenu = this.element.querySelector(".tasks-menu");
        this.attachTooltip(this.undoButton, "Undo");
        this.attachTooltip(this.redoButton, "Redo");
        this.attachTooltip(tasksMenu, "Tasks");
    }
    attachTooltip(containerElement, tooltip) {
        let tooltipDiv = document.createElement("div");
        tooltipDiv.classList.add("tooltip-name");
        tooltipDiv.innerHTML = tooltip;
        containerElement.appendChild(tooltipDiv);
        containerElement.addEventListener("mouseover", async ()=>{
            containerElement.querySelector(".tooltip-name").style.display = "block";
        });
        containerElement.addEventListener("mouseout", async ()=>{
            containerElement.querySelector(".tooltip-name").style.display = "none";
        });
    }
    async removeFocusHandler(event) {
        let closestContainer = event.target.closest(".document-editor");
        if (!closestContainer && !event.target.closest(".maintain-focus")) {
            if (this.currentElement) {
                this.currentElement.element.removeAttribute("id");
                await this.currentElement.focusoutFunction(this.currentElement.element);
                await this.stopTimer(true);
                delete this.currentElement;
                delete this.timer;
            }
        }
    }

    setContext() {
        let focusedElement = "none";
        let highlightedElement = document.querySelector("#highlighted-element");
        let childHighlightedElement = document.querySelector("#highlighted-child-element");
        let childElementMetadata;
        let elementMetadata;
        if (childHighlightedElement) {
            childElementMetadata = childHighlightedElement.getAttribute("data-metadata");
            focusedElement = `${JSON.stringify({
                metadata: childElementMetadata,
                text: childHighlightedElement.innerText
            })}`;

            elementMetadata = highlightedElement.getAttribute("data-metadata");
            focusedElement += ` which is inside the element ${JSON.stringify({
                metadata: elementMetadata,
                text: highlightedElement.innerText
            })}`;
        } else {
            if (highlightedElement) {
                elementMetadata = highlightedElement.getAttribute("data-metadata");
                focusedElement = {metadata: elementMetadata, text: highlightedElement.innerText};
            }
        }

        assistOS.context = {
            "location and available actions": `You are in the document editor page. The current document is ${this._document.title} with id ${this._document.id} and its about ${this._document.abstract}.`,
            "focused element": focusedElement
        }
    }

    async moveChapter(targetElement, direction) {
        const currentChapterElement = assistOS.UI.reverseQuerySelector(targetElement, "chapter-item");
        const currentChapterId = currentChapterElement.getAttribute('data-chapter-id');
        const currentChapterIndex = this._document.getChapterIndex(currentChapterId);

        const getAdjacentChapterId = (index, chapters) => {
            if (direction === "up") {
                return index === 0 ? chapters[chapters.length - 1].id : chapters[index - 1].id;
            } else {
                return index === chapters.length - 1 ? chapters[0].id : chapters[index + 1].id;
            }
        };

        const adjacentChapterId = getAdjacentChapterId(currentChapterIndex, this._document.chapters);
        await documentModule.swapChapters(assistOS.space.id, this._document.id, currentChapterId, adjacentChapterId, direction);
        this.swapChapters(currentChapterId, adjacentChapterId, direction);
    }

    async saveAbstract(abstractElement) {
        let abstractText = assistOS.UI.sanitize(abstractElement.value);
        if (abstractText !== this._document.abstract) {
            this._document.abstract = abstractText;
            await documentModule.updateDocumentAbstract(assistOS.space.id, this._document.id, abstractText);
        }
    }

    async addChapter(targetElement, direction) {
        let position = this._document.chapters.length;
        if (assistOS.space.currentChapterId) {
            if (direction === "above") {
                position = this._document.chapters.findIndex(
                    (chapter) => chapter.id === assistOS.space.currentChapterId);

            } else {
                position = this._document.chapters.findIndex(
                    (chapter) => chapter.id === assistOS.space.currentChapterId) + 1;
            }

        }
        let chapterTitle = assistOS.UI.sanitize("New Chapter");
        let chapterData = {title: chapterTitle, commands: {}, paragraphs: [
                {
                    text: "",
                    position: 0,
                    commands: {}
                }
            ]};
        chapterData.position = position;
        assistOS.space.currentChapterId = await documentModule.addChapter(assistOS.space.id, this._document.id, chapterData);

        await this.insertNewChapter(assistOS.space.currentChapterId, position);
    }


    async addParagraphTable(targetElement, mode) {
        // console.log(112);
        let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
        let mockEvent = {
            ctrlKey: true,
            key: "Enter",
            target: targetElement
        }
        chapterPresenter.addParagraphOrChapterOnKeyPress(mockEvent, "table");
    }

    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/documents-page`);
    }

    async saveTitle(textElement) {
        let titleText = assistOS.UI.sanitize(textElement.value);
        if (titleText !== this._document.title && titleText !== "") {
            this._document.title = titleText;
            await documentModule.updateDocumentTitle(assistOS.space.id, this._document.id, titleText);
        }
    }

    async changeCurrentElement(element, focusoutFunction) {
        if (this.currentElement) {
            this.currentElement.element.removeAttribute("id");
            await this.currentElement.focusoutFunction(this.currentElement.element);

            await this.stopTimer(true);
        }
        element.setAttribute("id", "current-selection");
        this.currentElement = {
            element: element,
            focusoutFunction: focusoutFunction,
        };
    }


    async titleKeyDownHandler(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    };

    async resetTimer() {
        await this.timer.reset(1000);
    }

    async stopTimer(executeFn) {
        if (this.timer) {
            await this.timer.stop(executeFn);
        }
    }

    async focusOutHandler(element, itemId) {
        let container = element.closest(".container-element");
        container.classList.remove("focused");
        element.removeEventListener('keydown', this.titleKeyDownHandler);
        element.removeEventListener('keydown', this.boundControlAbstractHeight);
        element.classList.remove("focused");

        this.stopTimer.bind(this, true);
        await selectionUtils.deselectItem(itemId, this);
        delete this.currentSelectItem;
        this.changeToolbarView(element, "off");
    }

    async controlAbstractHeight(abstract) {
        abstract.style.height = "auto";
        abstract.style.height = abstract.scrollHeight + 'px';
    }
    changeToolbarView(targetElement, mode) {
        let containerElement = targetElement.closest(".container-element");
        let toolbar = containerElement.querySelector(".toolbar");
        if(!toolbar){
            return;
        }
        mode === "on" ? toolbar.style.display = "flex" : toolbar.style.display = "none";
    }
    async highlightAbstract(targetElement) {
        if (!this.boundControlAbstractHeight) {
            this.boundControlAbstractHeight = this.controlAbstractHeight.bind(this, targetElement);
        }
        let containerElement = targetElement.closest(".container-element");
        containerElement.classList.add("focused");
        targetElement.classList.add("focused")
        targetElement.addEventListener('keydown', this.boundControlAbstractHeight);
        await this.changeCurrentElement(targetElement, this.focusOutHandler.bind(this, targetElement, this.abstractId));
        await selectionUtils.selectItem(true, this.abstractId, this.abstractClass, this);
        this.currentSelectItem = this.titleId;
        this.changeToolbarView(targetElement, "on");
    }
    async editItem(targetElement, type) {
        if (targetElement.getAttribute("id") === "current-selection") {
            return;
        }
        if (type === "paragraph") {
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            let paragraphItem = targetElement.closest("paragraph-item");
            let paragraphText = paragraphItem.querySelector(".paragraph-text");
            let paragraphPresenter = paragraphItem.webSkelPresenter;
            await this.changeCurrentElement(paragraphItem, paragraphPresenter.focusOutHandler.bind(paragraphPresenter, paragraphText));
            await paragraphPresenter.highlightParagraph();
            await selectionUtils.selectItem(false, paragraphPresenter.paragraph.id, paragraphPresenter.textClass, paragraphPresenter);
            await chapterPresenter.highlightChapter();
            return;
        }
        let saveFunction;
        let resetTimerFunction = this.resetTimer.bind(this);
        if (type === "title") {
            targetElement.classList.add("focused");
            let containerElement = targetElement.closest(".container-element");
            containerElement.classList.add("focused");
            await this.changeCurrentElement(targetElement, this.focusOutHandler.bind(this, targetElement, this.titleId));
            targetElement.addEventListener('keydown', this.titleKeyDownHandler);
            saveFunction = this.saveTitle.bind(this, targetElement);
            await selectionUtils.selectItem(true, this.titleId, this.titleClass, this);
            this.currentSelectItem = this.titleId;
        } else if (type === "abstract") {
            await this.highlightAbstract(targetElement);
            saveFunction = this.saveAbstract.bind(this, targetElement);
        } else if (type === "chapterTitle") {
            targetElement.classList.add("focused")
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            saveFunction = chapterPresenter.saveTitle.bind(chapterPresenter, targetElement);
            await this.changeCurrentElement(targetElement, chapterPresenter.focusOutHandlerTitle.bind(chapterPresenter, targetElement));
            await chapterPresenter.highlightChapter();
            targetElement.addEventListener('keydown', this.titleKeyDownHandler.bind(this, targetElement));
            await selectionUtils.selectItem(true, chapterPresenter.titleId, chapterPresenter.titleClass, chapterPresenter);
        } else if (type === "paragraphText") {
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            let paragraphItem = targetElement.closest("paragraph-item");
            let paragraphPresenter = paragraphItem.webSkelPresenter;
            await this.changeCurrentElement(targetElement, paragraphPresenter.focusOutHandler.bind(paragraphPresenter, targetElement));
            await chapterPresenter.highlightChapter();
            await paragraphPresenter.highlightParagraph();
            await selectionUtils.selectItem(true, paragraphPresenter.paragraph.id, paragraphPresenter.textClass, paragraphPresenter);
            saveFunction = paragraphPresenter.saveParagraph.bind(paragraphPresenter, targetElement);
            resetTimerFunction = paragraphPresenter.resetTimer.bind(paragraphPresenter, targetElement);
        }
        targetElement.focus();
        if (this.timer) {
            await this.timer.stop(true);
        }
        this.setContext();
        this.timer = new executorTimer(saveFunction, 10000);
        targetElement.addEventListener("keyup", resetTimerFunction);
    }

    executeDownload(targetElement, url) {
        let a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${assistOS.UI.unsanitize(this._document.title)}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        targetElement.remove();
    }

    showDownloadVideoButton(taskId, status) {
        if (status === "completed") {
            let downloadURL = `/documents/video/${assistOS.space.id}/${taskId}`;
            let downloadButton = `<button class="general-button download-video-button right-margin" data-local-action="executeDownload ${downloadURL}">Download Video</button>`
            this.element.querySelector(".menu-section").insertAdjacentHTML("afterbegin", downloadButton);
        }
    }

    async documentToVideo(button) {
        let taskId = await documentModule.documentToVideo(assistOS.space.id, this._document.id);
        assistOS.watchTask(taskId)
        this.boundShowDownloadVideoButton = this.showDownloadVideoButton.bind(this, taskId);
        await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, taskId, this.boundShowDownloadVideoButton);
    }

    async exportDocument(targetElement) {
        await assistOS.UI.showModal("export-document-modal", {id: this._document.id, title: this._document.title});
    }

    hideActionsMenu(controller, container, event) {
        let clickInsideMenu = event.target.closest(`#actions-menu`);
        if (!clickInsideMenu) {
            this.element.querySelector(`#actions-menu`).style.display = "none";
            container.setAttribute("data-local-action", `showActionsMenu off`);
            controller.abort();
        }
    }

    async showActionsMenu(targetElement, mode) {
        if (mode === "off") {
            let menu = this.element.querySelector(`#actions-menu`);
            menu.style.display = "flex";
            let controller = new AbortController();
            document.addEventListener("click", this.hideActionsMenu.bind(this, controller, targetElement), {signal: controller.signal});
            targetElement.setAttribute("data-local-action", `showActionsMenu on`);
        }
    }

    toggleEditingState(isEditable) {
        if (!isEditable) {
            this.disabledMask.style.display = "block";
            this.documentEditor.classList.add("disabled-editor");
            this.undoButton.classList.add("disabled");
            this.redoButton.classList.add("disabled");
        } else {
            this.documentEditor.classList.remove("disabled-editor");
            this.disabledMask.style.display = "none";
            this.undoButton.classList.remove("disabled");
            this.redoButton.classList.remove("disabled");
        }
    }

    async lipsyncVideo(targetElement) {
        const llmModule = require('assistos').loadModule('llm', {});
        const response = (await llmModule.lipsync(assistOS.space.id, "sync-1.6.0", {}))
    }

    async openTasksModal(targetElement) {
        let newTasksBadge = this.element.querySelector(".new-tasks-badge");
        if (newTasksBadge) {
            newTasksBadge.remove();
        }
        await assistOS.UI.showModal("document-tasks-modal", {["document-id"]: this._document.id});
    }

    renderNewTasksBadge() {
        let newTasksBadge = this.element.querySelector(".new-tasks-badge");
        if (newTasksBadge) {
            return;
        }
        newTasksBadge = `<div class="new-tasks-badge"></div>`;
        const tasksMenu = this.element.querySelector(".tasks-menu");
        tasksMenu.insertAdjacentHTML("beforeend", newTasksBadge);
    }

    openDocumentComment(_target) {
        const chapterMenu = `<document-comment-menu data-presenter="document-comment-menu"></document-comment-menu>`;
        this.element.querySelector('.document-title-container')?.insertAdjacentHTML('beforeend', chapterMenu);
        document.addEventListener('click', this.boundCloseDocumentComment);
    }

    closeDocumentComment(event) {
        if (event.target.closest('document-comment-menu')) {
            return;
        }
        document.removeEventListener('click', this.boundCloseDocumentComment);
        this.element.querySelector('document-comment-menu')?.remove();
    }

    async handleUserSelection(itemClass, data) {
        if (typeof data === "string") {
            return;
        }
        if (data.selected) {
            await selectionUtils.setUserIcon(data.userImageId, data.userEmail, data.selectId, itemClass, this);
            if (data.lockOwner && data.lockOwner !== this.selectId) {
                return selectionUtils.lockItem(itemClass, this);
            }
        } else {
            selectionUtils.removeUserIcon(data.selectId, this);
            if (!data.lockOwner) {
                selectionUtils.unlockItem(itemClass, this);
            }
        }
    }

    async afterUnload() {
        if (this.selectionInterval) {
            await selectionUtils.deselectItem(this.currentSelectItem, this);
        }
    }
    async translateDocument(){
        await assistOS.UI.showModal("translate-document-modal", {id: this._document.id});
    }
    async openPlugin(targetElement, type, pluginName) {
        if(type === "document"){
            let context = {
                documentId: this._document.id
            }
            await pluginUtils.openPlugin(pluginName, "document", context, this);
        } else if(type === "abstract"){
            let itemId = `${this.abstractId}_${pluginName}`;
            let context = {
                abstract: ""
            }
            await pluginUtils.openPlugin(pluginName, "abstract", context, this, itemId);
        }
    }
    async undoOperation(targetElement){
        this.toggleEditingState(false);
        let success = await documentModule.undoOperation(assistOS.space.id, this._document.id);
        if(success){
            assistOS.showToast("Undo successful.", 1500, "success");
        } else {
            assistOS.showToast("Nothing to undo.", 1500);
            this.toggleEditingState(true);
        }
    }
    async redoOperation(targetElement){
        this.toggleEditingState(false);
        let success = await documentModule.redoOperation(assistOS.space.id, this._document.id);
        if(success){
            assistOS.showToast("Redo successful.", 1500, "success");
        } else {
            assistOS.showToast("Nothing to redo.", 1500);
            this.toggleEditingState(true);
        }
    }
}
