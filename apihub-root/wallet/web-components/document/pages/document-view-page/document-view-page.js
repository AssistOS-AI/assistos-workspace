const documentModule = assistOS.loadModule("document");
const agentModule = assistOS.loadModule("agent");
const spaceModule = assistOS.loadModule("space");
import {executorTimer, unescapeHtmlEntities} from "../../../../imports.js";
import UIUtils from "./UIUtils.js";
import pluginUtils from "../../../../core/plugins/pluginUtils.js";

export class DocumentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.observers = [];

        this.tocState = false;
        this.torState = false;

        const documentId = this.element.getAttribute("documentId");
        this.invalidate(async () => {
            if (documentId === "demo") {
                const documents = await documentModule.getDocuments(assistOS.space.id);
                const docId = documents[documents.length - 1].id;
                this._document = await documentModule.loadDocument(assistOS.space.id, docId);
                this.viewMode = "demo";
            } else {
                this._document = await documentModule.loadDocument(assistOS.space.id, window.location.hash.split("/")[3]);
            }

            this.documentId = this._document.id;
            this.loadPluginStates();
            this.loadReferencesFromLocalStorage();
            this.refreshTableOfReferences();

            this.boundOnDocumentUpdate = this.onDocumentUpdate.bind(this);
            assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, this._document.id, this.boundOnDocumentUpdate);
            this.agents = await agentModule.getAgents(assistOS.space.id);
            this.boundrefreshAgents = this.refreshAgents.bind(this);
            assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, "personalities", this.boundrefreshAgents);
            this.selectedParagraphs = await documentModule.getSelectedDocumentItems(assistOS.space.id, this._document.id);
            await this.initTitleInfoTextSelection();
        });
    }

    async printDocument() {
        await assistOS.UI.showModal("print-document-modal", {id: this._document.id, title: this._document.title});
    }

    async initTitleInfoTextSelection() {
        this.infoTextClass = "document-infoText";
        this.infoTextTitleClass = "document-infoTextTitle";
        this.titleClass = "document-title";
        this.infoTextId = "infoText";
        this.infoTextTitleId = "infoTextTitle";
        this.titleId = "title";
        this.boundSelectInfoTextHandler = this.handleUserSelection.bind(this, this.infoTextClass);
        this.boundSelectTitleHandler = this.handleUserSelection.bind(this, this.titleClass);
        this.boundSelectInfoTextTitleHandler = this.handleUserSelection.bind(this, this.infoTextTitleClass);
        await assistOS.NotificationRouter.subscribeToDocument(this._document.id, this.infoTextId, this.boundSelectInfoTextHandler);
        await assistOS.NotificationRouter.subscribeToDocument(this._document.id, this.titleId, this.boundSelectTitleHandler);
        await assistOS.NotificationRouter.subscribeToDocument(this._document.id, this.infoTextTitleId, this.boundSelectInfoTextTitleHandler);
    }

    async getPersonalityName(personalityId) {
        let personality = this.agents.find(personality => personality.id === personalityId);
        return personality.name;
    }

    async getPersonalityImageByName(personalityName) {
        let personality = this.agents.find(personality => personality.name === personalityName);
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

    async refreshAgents() {
        this.agents = await agentModule.getAgents(assistOS.space.id);
    }

    async insertNewChapter(chapterId, position) {
        let newChapter = await documentModule.getChapter(assistOS.space.id, chapterId);
        this._document.chapters.splice(position, 0, newChapter);
        let previousChapterIndex = position - 1;
        if (previousChapterIndex < 0) {
            previousChapterIndex = 0;
        }
        let previousChapterId = this._document.chapters[previousChapterIndex].id;
        let previousChapter = this.element.querySelector(`chapter-item[data-chapter-id="${previousChapterId}"]`);
        if (!previousChapter) {
            let chapterContainer = this.element.querySelector(".chapters-container");
            chapterContainer.insertAdjacentHTML("afterbegin", `<chapter-item data-create-paragraph="true" data-chapter-number="${position + 1}" data-chapter-id="${newChapter.id}" data-presenter="chapter-item"></chapter-item>`);
            return;
        }
        previousChapter.insertAdjacentHTML("afterend", `<chapter-item data-create-paragraph="true" data-chapter-number="${position + 1}" data-chapter-id="${newChapter.id}" data-presenter="chapter-item"></chapter-item>`);
    }

    changeChapterOrder(chapterId, position) {
        let chapters = this._document.chapters;
        let currentChapterIndex = this._document.chapters.findIndex((chapter => chapter.id === chapterId));

        let [chapter] = chapters.splice(currentChapterIndex, 1);
        chapters.splice(position, 0, chapter);

        // Update the DOM
        let chapterElement = this.element.querySelector(`chapter-item[data-chapter-id="${chapterId}"]`);
        let referenceElement = this.element.querySelectorAll("chapter-item")[position];

        if (referenceElement) {
            referenceElement.insertAdjacentElement(position > currentChapterIndex ? 'afterend' : 'beforebegin', chapterElement);
        } else {
            this.element.appendChild(chapterElement); // If moving to the last position
        }
        let allChapters = this.element.querySelectorAll("chapter-item");
        for (let chapter of allChapters) {
            chapter.webSkelPresenter.updateChapterNumber();
        }
        if (this.tocState) {
            this.refreshTableOfContents();
        }
    }

    deleteChapter(chapterId) {
        let chapter = this.element.querySelector(`chapter-item[data-chapter-id="${chapterId}"]`);
        chapter.remove();
        this._document.chapters = this._document.chapters.filter((chapter) => chapter.id !== chapterId);
        let allChapters = this.element.querySelectorAll("chapter-item");
        for (let chapter of allChapters) {
            chapter.webSkelPresenter.updateChapterNumber();
            chapter.webSkelPresenter.changeChapterDeleteAvailability();
        }
        if (this.tocState) {
            this.refreshTableOfContents();
        }
    }

    async onDocumentUpdate(data) {
        if (typeof data === "object") {
            if (data.operationType === "add") {
                await this.insertNewChapter(data.chapterId, data.position);
                if (this.tocState) {
                    this.refreshTableOfContents();
                }
            } else if (data.operationType === "delete") {
                this.deleteChapter(data.chapterId);
                if (this.tocState) {
                    this.refreshTableOfContents();
                }
            } else if (data.operationType === "swap") {
                this.changeChapterOrder(data.chapterId, data.swapChapterId, data.direction);
                if (this.tocState) {
                    this.refreshTableOfContents();
                }
            }
        } else {
            switch (data) {
                case "delete":
                    await this.openDocumentsPage();
                    alert("The document has been deleted");
                    break;
                case "title":
                    let document = await documentModule.getDocument(assistOS.space.id, this._document.id);
                    this._document.title = document.title;
                    this.renderDocumentTitle();
                    if (this.tocState) {
                        this.refreshTableOfContents();
                    }
                    break;
                case "infoText":
                    let documentUpdated = await documentModule.getDocument(assistOS.space.id, this._document.id);
                    this._document.infoText = documentUpdated.infoText;
                    this.renderInfoText();
                    break;
                case "snapshots":
                    this._document.snapshots = await documentModule.getDocumentSnapshots(assistOS.space.id, this._document.id);
                    break;
                default:
                    console.error("Document: Unknown update type ", data);
                    break;
            }
        }
        this.toggleEditingState(true);
    }

    async beforeRender() {
        if (window.assistOS.stylePreferenceCache) {
            this.stylePreferences = window.assistOS.stylePreferenceCache
        } else {
            this.stylePreferences = await documentModule.getStylePreferences(assistOS.user.email);
        }
        this.documentFontSize = assistOS.constants.fontSizeMap[this.stylePreferences["document-title-font-size"]] || "24px";
        this.documentFontFamily = assistOS.constants.fontFamilyMap[this.stylePreferences["document-font-family"]] || "Arial";
        this.chapterFontSize = assistOS.constants.fontSizeMap[this.stylePreferences["chapter-title-font-size"]] || "20px"
        this.infoTextFontFamily = this.documentFontFamily
        this.infoTextFontSize = assistOS.constants.fontSizeMap[this.stylePreferences["infoText-font-size"]] || "16px";
        const textFontSize = this.stylePreferences["document-font-size"] ?? 16;
        this.fontSize = assistOS.constants.fontSizeMap[textFontSize]
        this.chaptersContainer = "";
        this.category = this._document.category;
        this.docTitle = this._document.title;
        this.loadReferencesFromLocalStorage();
        this.refreshTableOfReferences();
        if (this._document.chapters.length > 0) {
            this._document.chapters.forEach((item) => {
                this.chaptersContainer += `<chapter-item data-chapter-id="${item.id}" data-presenter="chapter-item"></chapter-item>`;
            });
        }
        document.documentElement.style.setProperty('--document-font-color', localStorage.getItem("document-font-color") || "#646464");
        await this.refreshVariables();
    }

    async refreshVariables() {
        this.variables = await documentModule.getDocumentVariables(assistOS.space.id, this._document.docId);
    }

    renderDocumentTitle() {
        let documentTitle = this.element.querySelector(".document-title");
        documentTitle.value = unescapeHtmlEntities(this._document.title);
    }

    renderInfoText() {
        let infoText = this.element.querySelector(".document-infoText");
        infoText.innerHTML = this._document.infoText || "";
        infoText.style.height = "auto";
        infoText.style.height = infoText.scrollHeight + 'px';
        infoText.addEventListener("paste", async () => {
            setTimeout(() => {
                infoText.style.height = infoText.scrollHeight + 'px';
            }, 0)
        });
    }

    async afterRender() {
        if (this.element.getAttribute('reducePadding')) {
            this.element.querySelector('.document-editor-container').style.padding = "0px";
        }
        let documentPluginsContainer = this.element.querySelector(".document-plugins-container");
        await pluginUtils.renderPluginIcons(documentPluginsContainer, "document");
        let infoTextPluginsContainer = this.element.querySelector(".infoText-plugins-container");
        await pluginUtils.renderPluginIcons(infoTextPluginsContainer, "infoText");
        this.renderDocumentTitle();
        this.renderInfoText();
        if (this.tocState) {
            this.showTableOfContents();
        }
        if (this.torState) {
            this.showTableOfReferences();
        }
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
        //this.undoButton = this.element.querySelector(".undo-button");
        //this.redoButton = this.element.querySelector(".redo-button");
        //let tasksMenu = this.element.querySelector(".tasks-menu");
        //let snapshotsButton = this.element.querySelector(".document-snapshots-modal");
        this.tableOfContents = this.element.querySelector(".table-of-contents");
        this.tableOfReferences = this.element.querySelector(".table-of-references");
        let scriptArgs = this.element.querySelector(".script-modal");
        let buildIcon = this.element.querySelector(".build-document");
        let commentsIcon = this.element.querySelector(".comments-icon-container");
        //this.attachTooltip(this.undoButton, "Undo");
        //this.attachTooltip(this.redoButton, "Redo");
        //this.attachTooltip(tasksMenu, "Tasks");
        //this.attachTooltip(snapshotsButton, "Snapshots");
        this.attachTooltip(this.tableOfContents, "Table of Contents");
        this.attachTooltip(this.tableOfReferences, "References");
        this.attachTooltip(scriptArgs, "Run Script");
        this.attachTooltip(commentsIcon, "Add Comment");
        this.attachTooltip(buildIcon, "Build Document");
        if (this.viewMode === "demo") {
            this.element.querySelector('.document-page-header')?.remove();
        }
        UIUtils.changeCommentIndicator(this.element, this._document.comments.messages);
        UIUtils.displayCurrentStatus(this.element, this._document.comments, "infoText");
    }

    async updateStatus(status, type, pluginName, autoPin) {
        UIUtils.changeStatusIcon(this.element, status, type, pluginName, autoPin);
        if(status === this._document.comments.status && pluginName === this._document.comments.plugin){
            return; // No change in status or plugin
        }
        this._document.comments.status = status;
        this._document.comments.plugin = pluginName;
        await documentModule.updateDocument(assistOS.space.id, this._document.id,
            this._document.title,
            this._document.docId,
            this._document.category,
            this._document.infoText,
            this._document.commands,
            this._document.comments);
    }
    async openSnapshotsModal(targetElement) {
        await assistOS.UI.showModal("document-snapshots-modal");
    }

    attachTooltip(containerElement, tooltip) {
        let tooltipDiv = document.createElement("div");
        tooltipDiv.classList.add("tooltip-name");
        tooltipDiv.innerHTML = tooltip;
        containerElement.appendChild(tooltipDiv);
        containerElement.addEventListener("mouseover", async () => {
            containerElement.querySelector(".tooltip-name").style.display = "block";
        });
        containerElement.addEventListener("mouseout", async () => {
            containerElement.querySelector(".tooltip-name").style.display = "none";
        });
    }

    async changeDocInfoDisplay(arrow) {
        let documentInfo = this.element.querySelector(".document-infoText");
        if (documentInfo.classList.contains("hidden")) {
            documentInfo.classList.remove("hidden");
            arrow.classList.remove("rotate");
        } else {
            documentInfo.classList.add("hidden");
            arrow.classList.add("rotate");
        }
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

    async moveChapter(targetElement, direction) {
        const currentChapterElement = assistOS.UI.reverseQuerySelector(targetElement, "chapter-item");
        const currentChapterId = currentChapterElement.getAttribute('data-chapter-id');
        const currentChapterIndex = this._document.chapters.findIndex((chapter => chapter.id === currentChapterId));

        const getNewPosition = (index, chapters) => {
            if (direction === "up") {
                return index === 0 ? chapters.length - 1 : index - 1;
            } else {
                return index === chapters.length - 1 ? 0 : index + 1;
            }
        };

        const position = getNewPosition(currentChapterIndex, this._document.chapters);
        await documentModule.changeChapterOrder(assistOS.space.id, this._document.id, currentChapterId, position);
        this.changeChapterOrder(currentChapterId, position);
    }

    async openScriptModal() {
        await assistOS.UI.showModal("run-script");
    }

    async saveInfoText(infoTextElement) {
        let infoText = assistOS.UI.sanitize(infoTextElement.value);
        if (infoText !== this._document.infoText) {
            this._document.infoText = infoText;
            await documentModule.updateDocument(assistOS.space.id, this._document.id,
                this._document.title,
                this._document.docId,
                this._document.category,
                infoText,
                this._document.commands,
                this._document.comments);
        }
    }

    async saveInfoTextTitle(input) {
        let infoTextTitle = assistOS.UI.sanitize(input.value);
        if (infoTextTitle !== this._document.infoTextTitle) {
            //TODO update infoTextTitle
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
        let chapter = await documentModule.addChapter(assistOS.space.id, this._document.id, chapterTitle, null, null, position);
        assistOS.space.currentChapterId = chapter.id;
        await this.insertNewChapter(assistOS.space.currentChapterId, position);
        let allChapters = this.element.querySelectorAll("chapter-item");
        for (let chapter of allChapters) {
            if (chapter.webSkelPresenter) {
                chapter.webSkelPresenter.updateChapterNumber();
                chapter.webSkelPresenter.changeChapterDeleteAvailability();
            }
        }
        if (this.tocState) {
            this.refreshTableOfContents();
        }
    }

    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/documents-page`);
    }

    async saveTitle(textElement) {
        let titleText = assistOS.UI.sanitize(textElement.value);
        if (titleText !== this._document.title && titleText !== "") {
            this._document.title = titleText;
            await documentModule.updateDocument(assistOS.space.id, this._document.id,
                titleText,
                this._document.docId,
                this._document.category,
                this._document.infoText,
                this._document.commands,
                this._document.comments);
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
        await this.focusOutHandlerTitle(element, itemId);
        element.removeEventListener('keydown', this.boundControlInfoTextHeight);
        this.changeToolbarView(element, "off");
        let pluginContainer = this.element.querySelector(`.infoText-plugin-container`);
        let pluginElement = pluginContainer.firstElementChild;
        if (!pluginElement) {
            return;
        }
        if (pluginElement.classList.contains("pinned")) {
            return;
        }
        this.currentPlugin = this.closePlugin("", true);
    }

    async focusOutHandlerTitle(element, itemId) {
        let container = element.closest(".container-element");
        container.classList.remove("focused");
        element.removeEventListener('keydown', this.titleKeyDownHandler);
        element.classList.remove("focused");
        this.stopTimer.bind(this, true);
        await UIUtils.deselectItem(itemId, this);
        delete this.currentSelectItem;
    }

    async controlInfoTextHeight(infoText) {
        infoText.style.height = "auto";
        infoText.style.height = infoText.scrollHeight + 'px';
    }

    changeToolbarView(targetElement, mode) {
        let containerElement = targetElement.closest(".container-element");
        let toolbar = containerElement.querySelector(".right-section");
        if (!toolbar) {
            return;
        }
        mode === "on" ? toolbar.style.display = "flex" : toolbar.style.display = "none";
    }

    async highlightInfoText(targetElement) {
        if (!this.boundControlInfoTextHeight) {
            this.boundControlInfoTextHeight = this.controlInfoTextHeight.bind(this, targetElement);
        }
        targetElement.addEventListener('keydown', this.boundControlInfoTextHeight);
        await this.changeCurrentElement(targetElement, this.focusOutHandler.bind(this, targetElement, this.infoTextId));
        let containerElement = targetElement.closest(".container-element");
        containerElement.classList.add("focused");
        targetElement.classList.add("focused")
        await UIUtils.selectItem(true, this.infoTextId, this.infoTextClass, this);
        this.currentSelectItem = this.infoTextId;
        this.changeToolbarView(targetElement, "on");
        if (this.currentPlugin) {
            await this.openPlugin("", "infoText", this.currentPlugin);
        }
    }

    async highlightInfoTextTitle(targetElement) {
        await this.changeCurrentElement(targetElement, this.focusOutHandler.bind(this, targetElement, this.infoTextTitleId));
        let containerElement = targetElement.closest(".container-element");
        containerElement.classList.add("focused");
        targetElement.classList.add("focused")
        await UIUtils.selectItem(true, this.infoTextTitleId, this.infoTextClass, this);
        this.currentSelectItem = this.infoTextTitleId;
        this.changeToolbarView(targetElement, "on");
        if (this.currentPlugin) {
            await this.openPlugin("", "infoText", this.currentPlugin);
        }
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
            await UIUtils.selectItem(false, paragraphPresenter.paragraph.id, paragraphPresenter.textClass, paragraphPresenter);
            await chapterPresenter.highlightChapter();
            return;
        }
        let saveFunction;
        let resetTimerFunction = this.resetTimer.bind(this);
        if (type === "title") {
            targetElement.classList.add("focused");
            let containerElement = targetElement.closest(".container-element");
            containerElement.classList.add("focused");
            await this.changeCurrentElement(targetElement, this.focusOutHandlerTitle.bind(this, targetElement, this.titleId));
            targetElement.addEventListener('keydown', this.titleKeyDownHandler);
            saveFunction = this.saveTitle.bind(this, targetElement);
            await UIUtils.selectItem(true, this.titleId, this.titleClass, this);
            this.currentSelectItem = this.titleId;
        } else if (type === "infoText") {
            await this.highlightInfoText(targetElement);
            saveFunction = this.saveInfoText.bind(this, targetElement);
        } else if (type === "infoTextTitle") {
            await this.highlightInfoTextTitle(targetElement);
            saveFunction = this.saveInfoTextTitle.bind(this, targetElement);
        } else if (type === "chapterTitle") {
            targetElement.classList.add("focused")
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            saveFunction = chapterPresenter.saveTitle.bind(chapterPresenter, targetElement);
            await this.changeCurrentElement(targetElement, chapterPresenter.focusOutHandlerTitle.bind(chapterPresenter, targetElement));
            await chapterPresenter.highlightChapter();
            await chapterPresenter.highlightChapterHeader();
            targetElement.addEventListener('keydown', this.titleKeyDownHandler.bind(this, targetElement));
            await UIUtils.selectItem(true, chapterPresenter.titleId, chapterPresenter.titleClass, chapterPresenter);
        } else if (type === "chapterHeader") {
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            await this.changeCurrentElement(targetElement, chapterPresenter.focusOutHandlerTitle.bind(chapterPresenter, targetElement));
            await chapterPresenter.highlightChapter();
            await chapterPresenter.highlightChapterHeader();
            await UIUtils.selectItem(true, chapterPresenter.titleId, chapterPresenter.titleClass, chapterPresenter);
        } else if (type === "paragraphText") {
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            let paragraphItem = targetElement.closest("paragraph-item");
            let paragraphPresenter = paragraphItem.webSkelPresenter;
            await this.changeCurrentElement(targetElement, paragraphPresenter.focusOutHandler.bind(paragraphPresenter, targetElement));
            await chapterPresenter.highlightChapter();
            await paragraphPresenter.highlightParagraph();
            await UIUtils.selectItem(true, paragraphPresenter.paragraph.id, paragraphPresenter.textClass, paragraphPresenter);
            saveFunction = paragraphPresenter.saveParagraph.bind(paragraphPresenter, targetElement);
            resetTimerFunction = paragraphPresenter.resetTimer.bind(paragraphPresenter, targetElement);
        }
        targetElement.focus();
        if (this.timer) {
            await this.timer.stop(true);
        }
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
        const llmModule = assistOS.loadModule("llm")
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

    async openCommentModal() {
        let comment = await assistOS.UI.showModal("add-comment", {}, true);
        if (comment !== undefined) {
            this._document.comments.messages.push(comment);
            UIUtils.changeCommentIndicator(this.element, this._document.comments.messages);
            await documentModule.updateDocument(assistOS.space.id, this._document.id,
                this._document.title,
                this._document.docId,
                this._document.category,
                this._document.infoText,
                this._document.commands,
                this._document.comments);
        }
    }
    showComments(iconContainer){
        assistOS.UI.createElement("comments-section", iconContainer, {
                comments: this._document.comments.messages,
                documentId: this._document.id,
            })
    }
    async updateComments(comments) {
        this._document.comments.messages = comments;
        await documentModule.updateDocument(assistOS.space.id, this._document.id,
            this._document.title,
            this._document.docId,
            this._document.category,
            this._document.infoText,
            this._document.commands,
            this._document.comments);
        if(this._document.comments.messages.length === 0){
            this.closeComments();
            UIUtils.changeCommentIndicator(this.element, this._document.comments.messages);
        }
    }
    closeComments(){
        let iconContainer = this.element.querySelector(".comment-icon-container");
        let commentsSection = iconContainer.querySelector("comments-section");
        commentsSection.remove();
    }
    async handleUserSelection(itemClass, data) {
        if (typeof data === "string") {
            return;
        }
        if (data.selected) {
            await UIUtils.setUserIcon(data.userImageId, data.userEmail, data.selectId, itemClass, this);
            if (data.lockOwner && data.lockOwner !== this.selectId) {
                return UIUtils.lockItem(itemClass, this);
            }
        } else {
            UIUtils.removeUserIcon(data.selectId, this);
            if (!data.lockOwner) {
                UIUtils.unlockItem(itemClass, this);
            }
        }
    }

    async afterUnload() {
        if (this.selectionInterval) {
            await UIUtils.deselectItem(this.currentSelectItem, this);
        }
        document.removeEventListener("click", this.boundRemoveFocusHandler);
    }

    async translateDocument() {
        await assistOS.UI.showModal("translate-document-modal", {id: this._document.id});
    }

    async openPlugin(targetElement, type, pluginName, autoPin) {
        let pluginContainer = this.element.querySelector(`.${type}-plugin-container`);
        let pluginElement = pluginContainer.firstElementChild;
        if (pluginElement && pluginElement.tagName.toLowerCase() === pluginName) {
            return;
        }
        if (type === "document") {
            let context = {
                documentId: this._document.id
            }
            await pluginUtils.openPlugin(pluginName, "document", context, this);
        } else if (type === "infoText") {
            let itemId = `${this.infoTextId}_${pluginName}`;
            let context = {
                infoText: ""
            }
            await pluginUtils.openPlugin(pluginName, "infoText", context, this, itemId, autoPin);
        }
    }

    closePlugin(targetElement, focusoutClose) {
        delete this.currentPlugin;
        let pluginContainer = this.element.querySelector(`.infoText-plugin-container`);
        pluginContainer.classList.remove("plugin-open");
        let pluginElement = pluginContainer.firstElementChild;
        if (!pluginElement) {
            return;
        }
        let pluginName = pluginElement.tagName.toLowerCase();
        pluginElement.remove();
        pluginUtils.removeHighlightPlugin("infoText", this);
        if (focusoutClose) {
            return pluginName;
        }
    }

    async undoOperation(targetElement) {
        this.toggleEditingState(false);
        let success = await documentModule.undoOperation(assistOS.space.id, this._document.id);
        if (success) {
            assistOS.showToast("Undo successful.", "success");
        } else {
            assistOS.showToast("Nothing to undo.", "info");
            this.toggleEditingState(true);
        }
    }

    async redoOperation(targetElement) {
        this.toggleEditingState(false);
        let success = await documentModule.redoOperation(assistOS.space.id, this._document.id);
        if (success) {
            assistOS.showToast("Redo successful.", "success");
        } else {
            assistOS.showToast("Nothing to redo.", "info");
            this.toggleEditingState(true);
        }
    }

    async buildForDocument(button) {
        button.classList.add("disabled");
        try {
            await spaceModule.buildForDocument(assistOS.space.id, this._document.docId);
            await assistOS.showToast("Build successful", "success", 5000);
        } catch (e) {
            await assistOS.showToast("Build failed", "error", 5000);
        } finally {
            button.classList.remove("disabled");
            await this.refreshVariables();
            this.notifyObservers("variables")
        }
    }

    observeChange(elementId, callback, callbackAsyncParamFn) {
        let obj = {elementId: elementId, callback: callback, param: callbackAsyncParamFn};
        callback.refferenceObject = obj;
        this.observers.push(new WeakRef(obj));
    }

    notifyObservers(prefix) {
        this.observers = this.observers.reduce((accumulator, item) => {
            if (item.deref()) {
                accumulator.push(item);
            }
            return accumulator;
        }, []);
        for (const observerRef of this.observers) {
            const observer = observerRef.deref();
            if (observer && observer.elementId.startsWith(prefix)) {
                observer.callback(observer.param);
            }
        }
    }


    // Table of Contents + References
    savePluginStates() {
        const storageKey = `doc_${this._document.id}_states`;
        const states = {
            tocState: this.tocState,
            torState: this.torState,
            torContentCollapsed: this.torContentCollapsed || false,
            references: this.references
        };
        localStorage.setItem(storageKey, JSON.stringify(states));
    }
    loadPluginStates() {
        try {
            const storageKey = `doc_${this._document.id}_states`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const states = JSON.parse(stored);
                this.tocState = states.tocState || false;
                this.torState = states.torState || false;
                this.torContentCollapsed = states.torContentCollapsed || false;
                this.references = states.references || [];
            } else {
                this.tocState = false;
                this.torState = false;
                this.torContentCollapsed = false;
                this.references = [];
            }
        } catch (e) {
            console.error("Failed to load plugin states from localStorage:", e);
            this.tocState = false;
            this.torState = false;
            this.torContentCollapsed = false;
            this.references = [];
        }
    }


    toggleTableOfContents() {
        this.tocState = !this.tocState;

        const tocButton = this.element.querySelector('.toc-toggle-btn');
        if (tocButton) {
            tocButton.classList.toggle('active', this.tocState);
        }

        if (this.tocState) {
            this.showTableOfContents();
        } else {
            this.hideTableOfContents();
        }

        this.savePluginStates();
    }
    showTableOfContents() {
        let tocContainer = this.element.querySelector('.toc-container');

        if (!tocContainer) {
            tocContainer = document.createElement('div');
            tocContainer.className = 'toc-container';
            tocContainer.innerHTML = `
            <div class="toc-header-container">
            <div class="toc-title-container">
            <div class="toc-visibility-arrow pointer" data-local-action="toggleTocVisibility"></div>
                <h3 class="toc-header">Table of Contents</h3>
                <div class="toc-actions">
                    <button class="toc-close-btn pointer" data-local-action="deleteToc">
                        <img src="./wallet/assets/icons/trash-can.svg" 
                        alt="close toc" 
                        loading="lazy" 
                        class="pointer black-icon">
                    </button>
                </div>
            </div>
            </div>
            <div class="toc-content">
            </div>`;

            tocContainer.querySelector('.toc-close-btn').addEventListener('click', () => {
                this.toggleTableOfContents();
            });

            const infoTextSection = this.element.querySelector('.infoText-section');
            infoTextSection.insertAdjacentElement('afterend', tocContainer);

            document.querySelector('.toc-visibility-arrow')?.addEventListener('click', function() {
                const tocContent = document.querySelector('.toc-content');
                if (tocContent) {
                    tocContent.style.display = tocContent.style.display === 'none' ? 'flex' : 'none';
                    this.classList.toggle('collapsed');
                }
            });
        }

        this.refreshTableOfContents();
    }
    hideTableOfContents() {
        const tocContainer = this.element.querySelector('.toc-container');
        if (tocContainer) {
            tocContainer.remove();
        }
    }
    refreshTableOfContents() {
        const tocContent = this.element.querySelector('.toc-content');
        if (!tocContent) return;

        tocContent.innerHTML = '';

        if (this._document.chapters && this._document.chapters.length > 0) {
            this._document.chapters.forEach((chapter, index) => {
                const chapterItem = document.createElement('a');
                chapterItem.className = 'toc-item toc-chapter';
                chapterItem.href = `#chapter-${chapter.id}`;
                chapterItem.textContent = `Chapter ${index + 1}: ${assistOS.UI.unsanitize(chapter.title)}`;
                chapterItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    const chapterElement = this.element.querySelector(`chapter-item[data-chapter-id="${chapter.id}"]`);
                    if (chapterElement) {
                        chapterElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
                tocContent.appendChild(chapterItem);
            });
        } else {
            const noChapters = document.createElement('div');
            noChapters.className = 'toc-item toc-empty';
            noChapters.textContent = 'No chapters available';
            tocContent.appendChild(noChapters);
        }
    }


    toggleTableOfReferences() {
        this.torState = !this.torState;

        const torButton = this.element.querySelector('.tor-toggle-btn');
        if (torButton) {
            torButton.classList.toggle('active', this.torState);
        }

        if (this.torState) {
            this.showTableOfReferences();
        } else {
            this.hideTableOfReferences();
        }

        this.savePluginStates();
    }
    showTableOfReferences() {
        let torContainer = this.element.querySelector(".tor-container");

        if (!torContainer) {
            torContainer = document.createElement("div");
            torContainer.className = "tor-container";
            torContainer.innerHTML = `
            <div class="tor-header-container">
                <div class="tor-title-container">
                    <img class="tor-visibility-arrow pointer unfocusable black-icon" 
                        data-local-action="toggleTorVisibility" 
                        src="./wallet/assets/icons/arrow-down.svg" 
                        alt="toggle tor">
                    <h3 class="tor-header">References</h3>
                    <div class="tor-actions">
                        <button class="add-reference-btn" data-local-action="add-reference">
                            <img class="black-icon" loading="lazy" src="./wallet/assets/icons/square-plus.svg" alt="icon">
                        </button>
                        <button class="tor-close-btn pointer" data-local-action="deleteTor">
                            <img src="./wallet/assets/icons/trash-can.svg" 
                                alt="close tor" 
                                loading="lazy" 
                                class="pointer black-icon">
                        </button>
                    </div>
                </div>
            </div>
            <div class="tor-content"></div>`;

            torContainer.querySelector('.tor-close-btn').addEventListener('click', () => {
                this.toggleTableOfReferences();
            });

            const visibilityArrow = torContainer.querySelector('.tor-visibility-arrow');
            if (visibilityArrow) {
                visibilityArrow.addEventListener('click', () => {
                    const torContent = torContainer.querySelector('.tor-content');
                    if (torContent) {
                        const isHidden = torContent.style.display === 'none';
                        torContent.style.display = isHidden ? 'block' : 'none';
                        visibilityArrow.classList.toggle('collapsed', !isHidden);
                        this.torContentCollapsed = !isHidden;
                        this.savePluginStates();
                    }
                });
            }

            const addRefButton = torContainer.querySelector(".add-reference-btn");
            if (addRefButton) {
                addRefButton.addEventListener("click", () => this.addReference());
            }

            const documentEditor = this.element.querySelector(".document-editor");
            if (documentEditor) {
                documentEditor.appendChild(torContainer);
            } else {
                this.element.appendChild(torContainer);
            }
        }

        torContainer.style.display = "block";
        if (this.torContentCollapsed) {
            const torContent = torContainer.querySelector('.tor-content');
            const visibilityArrow = torContainer.querySelector('.tor-visibility-arrow');
            if (torContent && visibilityArrow) {
                torContent.style.display = 'none';
                visibilityArrow.classList.add('collapsed');
            }
        }
        this.refreshTableOfReferences();

        if (!this.element.querySelector("#reference-modal")) {
            const modalHTML = document.createElement("div");
            modalHTML.id = "reference-modal";
            modalHTML.innerHTML = `
            <div class="modal-overlay hidden">
                <div class="modal-window reference-modal-window">
                    <h3 class="modal-title">Add/Edit Reference</h3>
                    
                    <div class="reference-type-section">
                        <label>Reference Type:</label>
                        <select id="reference-type-select" class="modal-input">
                            <option value="journal">Journal Article</option>
                            <option value="book">Book</option>
                            <option value="website">Website</option>
                            <option value="report">Report</option>
                        </select>
                    </div>
    
                    <div class="reference-fields">
                        <div class="field-group">
                            <label>Author(s) <span class="required">*</span></label>
                            <input type="text" id="reference-authors" class="modal-input" placeholder="Last, F. M., & Last, F. M." />
                            <small class="field-help">Format: Last, F. M., or Last, F. M., & Last, F. M. for multiple authors</small>
                        </div>
        
                        <div class="field-group">
                            <label>Publication Year <span class="required">*</span></label>
                            <input type="number" id="reference-year" class="modal-input" min="1900" max="2025" />
                        </div>
        
                        <div class="field-group">
                            <label>Title <span class="required">*</span></label>
                            <input type="text" id="reference-title" class="modal-input" />
                        </div>
        
                        <!-- Journal-specific fields -->
                        <div class="field-group journal-field">
                            <label>Volume</label>
                            <input type="text" id="reference-volume" class="modal-input" />
                        </div>
        
                        <div class="field-group journal-field">
                            <label>Pages</label>
                            <input type="text" id="reference-pages" class="modal-input" placeholder="123-145" />
                        </div>
        
                        <!-- Book-specific fields -->
                        <div class="field-group book-field">
                            <label>Publisher <span class="required">*</span></label>
                            <input type="text" id="reference-publisher" class="modal-input" />
                        </div>
        
                        <div class="field-group book-field">
                            <label>Publisher Location</label>
                            <input type="text" id="reference-location" class="modal-input" />
                        </div>
        
                        <!-- Website-specific fields -->
                        <div class="field-group website-field">
                            <label>Website Name</label>
                            <input type="text" id="reference-website" class="modal-input" />
                        </div>
        
                        <div class="field-group website-field">
                            <label>Access Date</label>
                            <input type="date" id="reference-access-date" class="modal-input" />
                        </div>
        
                        <!-- Common URL field -->
                        <div class="field-group">
                            <label>URL/DOI</label>
                            <input type="text" id="reference-url" class="modal-input" placeholder="https://... or doi:..." />
                        </div>
                    </div>
        
                    <div class="citation-preview">
                        <h4>Citation Preview:</h4>
                        <div id="citation-preview-text" class="preview-text"></div>
                    </div>
        
                    <div class="modal-actions">
                        <button id="save-reference-btn" class="btn-primary">Save Reference</button>
                        <button id="cancel-reference-btn" class="btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>`;

            this.element.appendChild(modalHTML);

            const overlay = modalHTML.querySelector(".modal-overlay");
            const cancelBtn = modalHTML.querySelector("#cancel-reference-btn");
            const typeSelect = modalHTML.querySelector("#reference-type-select");

            // Show/hide fields based on reference type
            typeSelect.addEventListener("change", () => {
                this.toggleReferenceFields(typeSelect.value);
                this.updateCitationPreview();
            });

            // Real-time preview update
            const inputs = modalHTML.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.updateCitationPreview());
            });

            cancelBtn.addEventListener("click", () => {
                overlay.classList.add("hidden");
            });

            modalHTML.querySelector(".modal-overlay").addEventListener("click", (e) => {
                if (e.target.classList.contains("modal-overlay")) {
                    overlay.classList.add("hidden");
                }
            });
        }
    }
    hideTableOfReferences() {
        const torContainer = this.element.querySelector('.tor-container');
        if (torContainer) {
            torContainer.remove();
        }
    }
    refreshTableOfReferences() {
        const torContent = this.element.querySelector('.tor-content');
        if (!torContent) return;

        torContent.innerHTML = '';

        if (this.references.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'tor-empty';
            emptyMessage.textContent = 'No references available. Click \'Add Reference\' to add one.';
            torContent.appendChild(emptyMessage);
            return;
        }

        // Sort references alphabetically by author for APA style
        const sortedReferences = [...this.references].sort((a, b) => {
            const authorA = a.authors || a.name || '';
            const authorB = b.authors || b.name || '';
            return authorA.localeCompare(authorB);
        });

        sortedReferences.forEach((reference, index) => {
            const referenceItem = document.createElement('div');
            referenceItem.className = 'tor-item';

            const citation = reference.authors ?
                this.generateAPACitation(reference) :
                `${reference.name} - ${reference.link}`;

            referenceItem.innerHTML = `
            <div class="tor-row">
                <div class="reference-content">
                    <span class="reference-number">[${index + 1}]</span>
                    <span class="reference-citation">${citation}</span>
                </div>
                <div class="reference-actions">
                   <button class="edit-reference-btn" data-reference-id="${reference.id}">Edit</button>
                   <button class="delete-reference-btn" data-reference-id="${reference.id}">Delete</button>
                </div>
            </div>`;

            referenceItem.querySelector('.edit-reference-btn').addEventListener('click', () => {
                this.editReference(reference.id);
            });

            referenceItem.querySelector('.delete-reference-btn').addEventListener('click', () => {
                this.deleteReference(reference.id);
            });

            torContent.appendChild(referenceItem);
        });
    }


    toggleReferenceFields(type) {
        const modal = this.element.querySelector("#reference-modal");
        const allFields = modal.querySelectorAll('.field-group');

        allFields.forEach(field => {
            if (field.classList.contains('journal-field') ||
                field.classList.contains('book-field') ||
                field.classList.contains('website-field')) {
                field.style.display = 'none';
            }
        });

        const fieldsToShow = modal.querySelectorAll(`.${type}-field`);
        fieldsToShow.forEach(field => {
            field.style.display = 'block';
        });
    }
    updateCitationPreview() {
        const modal = this.element.querySelector("#reference-modal");
        if (!modal) return;

        const getValue = (id) => modal.querySelector(`#${id}`)?.value?.trim() || '';

        const data = {
            type: getValue('reference-type-select'),
            authors: getValue('reference-authors'),
            year: getValue('reference-year'),
            title: getValue('reference-title'),
            volume: getValue('reference-volume'),
            pages: getValue('reference-pages'),
            publisher: getValue('reference-publisher'),
            location: getValue('reference-location'),
            website: getValue('reference-website'),
            accessDate: getValue('reference-access-date'),
            url: getValue('reference-url')
        };

        const citation = this.generateAPACitation(data);
        const previewElement = modal.querySelector('#citation-preview-text');
        if (previewElement) {
            previewElement.textContent = citation;
        }
    }
    generateAPACitation(data) {
        if (!data.authors || !data.year || !data.title) {
            return "Please fill in required fields to see preview";
        }

        let citation = `${data.authors} (${data.year}). `;

        switch (data.type) {
            case 'journal':
                citation += `${data.title}. `;
                if (data.journal) {
                    citation += `*${data.journal}*`;
                    if (data.volume) citation += `, ${data.volume}`;
                    if (data.pages) citation += `, ${data.pages}`;
                    citation += '. ';
                }
                break;

            case 'book':
                citation += `*${data.title}*. `;
                if (data.publisher) {
                    if (data.location) citation += `${data.location}: `;
                    citation += `${data.publisher}. `;
                }
                break;

            case 'website':
                citation += `${data.title}. `;
                if (data.website) citation += `*${data.website}*. `;
                if (data.accessDate) {
                    const date = new Date(data.accessDate);
                    citation += `Retrieved ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. `;
                }
                break;

            case 'report':
                citation += `*${data.title}*`;
                if (data.publisher) citation += ` (Report). ${data.publisher}`;
                citation += '. ';
                break;

            default:
                citation += `*${data.title}*. `;
        }

        if (data.url) {
            if (data.url.startsWith('doi:')) {
                citation += `https://doi.org/${data.url.substring(4)}`;
            } else {
                citation += data.url;
            }
        }

        return citation;
    }


    addReference() {
        this.openReferenceModal();
    }
    editReference(referenceId) {
        const ref = this.references.find(r => r.id === referenceId);
        if (ref) {
            this.openReferenceModal(ref);
        }
    }
    deleteReference(referenceId) {
        if (confirm('Are you sure you want to delete this reference?')) {
            this.references = this.references.filter(ref => ref.id !== referenceId);
            this.refreshTableOfReferences();
            this.savePluginStates();
            this.saveReferencesToLocalStorage();
            this.refreshTableOfReferences();
        }
    }



    openReferenceModal(reference = null) {

        const overlay = this.element.querySelector("#reference-modal .modal-overlay");
        const saveBtn = this.element.querySelector("#save-reference-btn");

        if (reference) {
            const fields = [
                'reference-type-select', 'reference-authors', 'reference-year', 'reference-title',
                'reference-volume', 'reference-pages',
                'reference-publisher', 'reference-location', 'reference-website',
                'reference-access-date', 'reference-url'
            ];

            fields.forEach(fieldId => {
                const element = this.element.querySelector(`#${fieldId}`);
                if (element && reference[fieldId.replace('reference-', '').replace('-', '_')]) {
                    element.value = reference[fieldId.replace('reference-', '').replace('-', '_')];
                }
            });

            if (reference.type) this.element.querySelector('#reference-type-select').value = reference.type;
            if (reference.access_date) this.element.querySelector('#reference-access-date').value = reference.access_date;
        } else {
            const inputs = this.element.querySelectorAll('#reference-modal input, #reference-modal select');
            inputs.forEach(input => input.value = '');
        }

        const typeSelect = this.element.querySelector('#reference-type-select');
        this.toggleReferenceFields(typeSelect.value);
        this.updateCitationPreview();

        overlay.classList.remove("hidden");

        const saveHandler = () => {
            const getValue = (id) => this.element.querySelector(`#${id}`)?.value?.trim() || '';

            const authors = getValue('reference-authors');
            const year = getValue('reference-year');
            const title = getValue('reference-title');

            if (!authors || !year || !title) {
                alert("Authors, Year, and Title are required fields.");
                return;
            }

            const newReference = {
                id: reference?.id || Date.now().toString(),
                type: getValue('reference-type-select'),
                authors,
                year: parseInt(year),
                title,
                volume: getValue('reference-volume'),
                pages: getValue('reference-pages'),
                publisher: getValue('reference-publisher'),
                location: getValue('reference-location'),
                website: getValue('reference-website'),
                access_date: getValue('reference-access-date'),
                url: getValue('reference-url')
            };

            if (reference) {
                const index = this.references.findIndex(r => r.id === reference.id);
                if (index !== -1) {
                    this.references[index] = newReference;
                }
            } else {
                this.references.push(newReference);
            }

            overlay.classList.add("hidden");
            this.refreshTableOfReferences();
            this.savePluginStates();
            this.saveReferencesToLocalStorage();

            saveBtn.removeEventListener("click", saveHandler);
        };

        saveBtn.addEventListener("click", saveHandler);
    }
    saveReferencesToLocalStorage() {
        try {
            const storedDict = localStorage.getItem('documentReferencesDict');
            const dict = storedDict ? JSON.parse(storedDict) : {};
            dict[this.documentId] = this.references;
            localStorage.setItem('documentReferencesDict', JSON.stringify(dict));
        } catch (e) {
            console.error("Failed to save references to localStorage:", e);
        }
    }
    loadReferencesFromLocalStorage() {
        try {
            const storedDict = localStorage.getItem('documentReferencesDict');
            if (storedDict) {
                const dict = JSON.parse(storedDict);
                this.references = dict[this.documentId] || [];
            } else {
                this.references = [];
            }
        } catch (e) {
            console.error("Failed to load references from localStorage:", e);
            this.references = [];
        }
    }
}
