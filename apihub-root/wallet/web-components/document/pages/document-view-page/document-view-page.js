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
            this.agents = await agentModule.getAgents(assistOS.space.id);
        });
    }
    async refreshVariables(){
        this.variables = await documentModule.getDocCommandsParsed(assistOS.space.id, this._document.docId);
    }
    getVariables(chapterId, paragraphId) {
        return this.variables.filter(variable => {
            return variable.chapterId === chapterId && variable.paragraphId === paragraphId;
        })
    }
    async printDocument() {
        await assistOS.UI.showModal("print-document-modal", {id: this._document.id, title: this._document.title});
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
        this.refreshTableOfContents();
    }
    refreshTableOfContents(){
        let contentsTable = this.element.querySelector("contents-table");
        if(contentsTable) {
            contentsTable.webSkelPresenter.refreshTableOfContents();
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
        this.refreshTableOfContents();
    }

    async onDocumentUpdate(data) {
        if (typeof data === "object") {
            if (data.operationType === "add") {
                await this.insertNewChapter(data.chapterId, data.position);
                this.refreshTableOfContents();

            } else if (data.operationType === "delete") {
                this.deleteChapter(data.chapterId);
                this.refreshTableOfContents();

            } else if (data.operationType === "swap") {
                this.changeChapterOrder(data.chapterId, data.swapChapterId, data.direction);
                this.refreshTableOfContents();
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
                    this.refreshTableOfContents();
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
        //this.toggleEditingState(true);
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
        if (this._document.chapters.length > 0) {
            this._document.chapters.forEach((item) => {
                this.chaptersContainer += `<chapter-item data-chapter-id="${item.id}" data-presenter="chapter-item"></chapter-item>`;
            });
        }
        document.documentElement.style.setProperty('--document-font-color', localStorage.getItem("document-font-color") || "#646464");
        await this.refreshVariables();
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
        let infoTextTitle = this.element.querySelector("#info-text-title");
        infoTextTitle.value = assistOS.UI.unsanitize(this._document.comments.infoTextTitle) || "Document Info";
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
        if (this._document.comments.toc) {
            this.showTableOfContents();
        }
        if (this._document.comments.tor) {
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
        if(this._document.comments.pluginLastOpened){
            await this.openPlugin("", "infoText", this._document.comments.pluginLastOpened, true);
        }
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
    async updateLastOpenedPlugin(pluginName) {
        if (this._document.comments.pluginLastOpened === pluginName) {
            return; // No change in plugin
        }
        this._document.comments.pluginLastOpened = pluginName;
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
        if (infoTextTitle !== this._document.comments.infoTextTitle) {
            this._document.comments.infoTextTitle = infoTextTitle;
            await documentModule.updateDocument(assistOS.space.id, this._document.id,
                this._document.title,
                this._document.docId,
                this._document.category,
                this._document.infoText,
                this._document.commands,
                this._document.comments);
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
        this.refreshTableOfContents();
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

    async focusOutHandler(element) {
        await this.focusOutHandlerTitle(element);
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
        this.currentPlugin = await this.closePlugin("", true);
    }

    async focusOutHandlerTitle(element) {
        let container = element.closest(".container-element");
        container.classList.remove("focused");
        element.removeEventListener('keydown', this.titleKeyDownHandler);
        element.classList.remove("focused");
        this.stopTimer.bind(this, true);
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
        await this.changeCurrentElement(targetElement, this.focusOutHandler.bind(this, targetElement));
        let containerElement = targetElement.closest(".container-element");
        containerElement.classList.add("focused");
        targetElement.classList.add("focused")
        this.changeToolbarView(targetElement, "on");
        if (this.currentPlugin) {
            await this.openPlugin("", "infoText", this.currentPlugin);
        }
    }

    async highlightInfoTextTitle(targetElement) {
        await this.changeCurrentElement(targetElement, this.focusOutHandler.bind(this, targetElement));
        let containerElement = targetElement.closest(".container-element");
        containerElement.classList.add("focused");
        targetElement.classList.add("focused")
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
            await chapterPresenter.highlightChapter();
            return;
        }else if (type === "infoTextSection") {
            await this.changeCurrentElement(targetElement, this.focusOutHandler.bind(this, targetElement, this.infoTextId));
            let containerElement = targetElement.closest(".container-element");
            containerElement.classList.add("focused");
            this.changeToolbarView(targetElement, "on");
            if (this.currentPlugin) {
                await this.openPlugin("", "infoText", this.currentPlugin);
            }
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
        } else if (type === "chapterHeader") {
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            await this.changeCurrentElement(targetElement, chapterPresenter.focusOutHandlerTitle.bind(chapterPresenter, targetElement));
            await chapterPresenter.highlightChapter();
            await chapterPresenter.highlightChapterHeader();
        } else if (type === "paragraphText") {
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            let paragraphItem = targetElement.closest("paragraph-item");
            let paragraphPresenter = paragraphItem.webSkelPresenter;
            await this.changeCurrentElement(targetElement, paragraphPresenter.focusOutHandler.bind(paragraphPresenter, targetElement));
            await chapterPresenter.highlightChapter();
            await paragraphPresenter.highlightParagraph();
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

    // toggleEditingState(isEditable) {
    //     if (!isEditable) {
    //         this.disabledMask.style.display = "block";
    //         this.documentEditor.classList.add("disabled-editor");
    //         this.undoButton.classList.add("disabled");
    //         this.redoButton.classList.add("disabled");
    //     } else {
    //         this.documentEditor.classList.remove("disabled-editor");
    //         this.disabledMask.style.display = "none";
    //         this.undoButton.classList.remove("disabled");
    //         this.redoButton.classList.remove("disabled");
    //     }
    // }

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

    async afterUnload() {
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
            let context = {
                infoText: ""
            }
            await pluginUtils.openPlugin(pluginName, "infoText", context, this, autoPin);
        }
        await this.updateLastOpenedPlugin(pluginName);
    }

    async closePlugin(targetElement, focusoutClose) {
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
        await this.updateLastOpenedPlugin("");
        if (focusoutClose) {
            return pluginName;
        }
    }

    // async undoOperation(targetElement) {
    //     this.toggleEditingState(false);
    //     let success = await documentModule.undoOperation(assistOS.space.id, this._document.id);
    //     if (success) {
    //         assistOS.showToast("Undo successful.", "success");
    //     } else {
    //         assistOS.showToast("Nothing to undo.", "info");
    //         this.toggleEditingState(true);
    //     }
    // }
    //
    // async redoOperation(targetElement) {
    //     this.toggleEditingState(false);
    //     let success = await documentModule.redoOperation(assistOS.space.id, this._document.id);
    //     if (success) {
    //         assistOS.showToast("Redo successful.", "success");
    //     } else {
    //         assistOS.showToast("Nothing to redo.", "info");
    //         this.toggleEditingState(true);
    //     }
    // }

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

    async openToc(){
        this.showTableOfContents();
        this._document.comments.toc = {
            collapsed: false
        };
        await documentModule.updateDocument(assistOS.space.id, this._document.id,
            this._document.title,
            this._document.docId,
            this._document.category,
            this._document.infoText,
            this._document.commands,
            this._document.comments);
    }
    showTableOfContents() {
        let contentsTable = this.element.querySelector("contents-table");
        if (contentsTable) {
            return;
        }
        const infoTextSection = this.element.querySelector('.infoText-section');
        infoTextSection.insertAdjacentHTML('afterend', `<contents-table data-presenter="contents-table"></contents-table>`);
    }

    async openTor(){
        this.showTableOfReferences();
        this._document.comments.tor = {
            collapsed: false,
            references: []
        };
        await documentModule.updateDocument(assistOS.space.id, this._document.id,
            this._document.title,
            this._document.docId,
            this._document.category,
            this._document.infoText,
            this._document.commands,
            this._document.comments);
    }

    showTableOfReferences() {
        let refsTable = this.element.querySelector("references-table");
        if (refsTable) {
            return;
        }
        const documentEditor = this.element.querySelector(".document-editor");
        documentEditor.insertAdjacentHTML("beforeend", `<references-table data-presenter="references-table"></references-table>`);
    }

}
