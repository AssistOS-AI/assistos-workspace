const documentModule = require("assistos").loadModule("document", {});
const agentModule = require("assistos").loadModule("agent", {});
const spaceModule = require("assistos").loadModule("space", {});
import {executorTimer, unescapeHtmlEntities} from "../../../../imports.js";
import selectionUtils from "./selectionUtils.js";
import pluginUtils from "../../../../core/plugins/pluginUtils.js";

export class DocumentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.observers = [];
        this.boundCloseDocumentComment = this.closeDocumentComment.bind(this);
        this.invalidate(async () => {
            this._document = await documentModule.loadDocument(assistOS.space.id, window.location.hash.split("/")[3]);
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

    async addTableOfContents(targetElement) {
        if (!this._document) {
            console.error("Document data is not available.");
            return;
        }

        let tocContainer = this.element.querySelector(".toc-container");

        if (!tocContainer) {
            tocContainer = document.createElement("div");
            tocContainer.className = "toc-container";

            const tocHeader = document.createElement("h3");
            tocHeader.className = "toc-header";
            tocHeader.textContent = "Table of Contents";

            const deleteButton = document.createElement("button");
            deleteButton.className = "toc-delete-btn";
            deleteButton.innerHTML = "×";
            deleteButton.addEventListener("click", async () => {
                await this.removeTableOfContents();
            });

            const tocContent = document.createElement("div");
            tocContent.className = "toc-content";

            const headerContainer = document.createElement("div");
            headerContainer.className = "toc-header-container";
            headerContainer.appendChild(tocHeader);
            headerContainer.appendChild(deleteButton);

            tocContainer.appendChild(headerContainer);
            tocContainer.appendChild(tocContent);

            const titleElement = this.element.querySelector(".document-title-container");
            const infoText = this.element.querySelector(".document-infoText-container");

            if (titleElement && infoText) {
                titleElement.parentNode.insertBefore(tocContainer, infoText);
            } else {
                console.error("Cannot find title or infoText containers");
                return;
            }
        }

        const tocContent = tocContainer.querySelector(".toc-content");
        tocContent.innerHTML = "";

        if (this._document.title) {
            const titleItem = document.createElement("a");
            titleItem.className = "toc-item toc-title";
            titleItem.href = "#document-title";
            titleItem.textContent = assistOS.UI.unsanitize(this._document.title);
            titleItem.addEventListener("click", (e) => {
                e.preventDefault();
                document.querySelector(".document-title").scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            });
            tocContent.appendChild(titleItem);
        }

        if (this._document.infoText) {
            const infoTextItem = document.createElement("a");
            infoTextItem.className = "toc-item toc-infoText";
            infoTextItem.href = "#document-infoText";
            infoTextItem.textContent = "Document Info";
            infoTextItem.addEventListener("click", (e) => {
                e.preventDefault();
                document.querySelector(".document-infoText").scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            });
            tocContent.appendChild(infoTextItem);
        }

        if (this._document.chapters && this._document.chapters.length > 0) {
            this._document.chapters.forEach((chapter, index) => {
                const chapterItem = document.createElement("a");
                chapterItem.className = "toc-item toc-chapter";
                chapterItem.href = `#chapter-${chapter.id}`;
                chapterItem.textContent = `Chapter ${index + 1}: ${assistOS.UI.unsanitize(chapter.title)}`;
                chapterItem.addEventListener("click", (e) => {
                    e.preventDefault();
                    const chapterElement = document.querySelector(`chapter-item[data-chapter-id="${chapter.id}"]`);
                    if (chapterElement) {
                        chapterElement.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
                    }
                });
                tocContent.appendChild(chapterItem);
            });
        } else {
            const noChapters = document.createElement("div");
            noChapters.className = "toc-item toc-empty";
            noChapters.textContent = "No chapters available";
            tocContent.appendChild(noChapters);
        }

        this._document.hasTableOfContents = true;
        await documentModule.updateDocumentProperty(
            assistOS.space.id,
            this._document.id,
            "hasTableOfContents",
            true
        );

        console.log("Table of Contents added as standalone element between title and infoText");
    }
    async removeTableOfContents() {
        const tocContainer = this.element.querySelector(".toc-container");
        if (tocContainer) {
            tocContainer.remove();

            await documentModule.updateDocumentProperty(
                assistOS.space.id,
                this._document.id,
                "hasTableOfContents",
                false
            );

            console.log("Table of Contents removed from document.");
        }
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

    async getPersonalityName(personalityId){
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
            chapterContainer.insertAdjacentHTML("afterbegin", `<chapter-item data-chapter-number="${position + 1}" data-chapter-id="${newChapter.id}" data-metadata="chapter nr. ${position + 1} with title ${newChapter.title} and id ${newChapter.id}" data-title-metadata="title of the current chapter" data-presenter="chapter-item"></chapter-item>`);
            return;
        }
        previousChapter.insertAdjacentHTML("afterend", `<chapter-item data-chapter-number="${position + 1}" data-chapter-id="${newChapter.id}" data-metadata="chapter nr. ${position + 1} with title ${newChapter.title} and id ${newChapter.id}" data-title-metadata="title of the current chapter" data-presenter="chapter-item"></chapter-item>`);
    }

    changeChapterOrder(chapterId, position) {
        let chapters = this._document.chapters;
        let currentChapterIndex = this._document.getChapterIndex(chapterId);

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
                this.changeChapterOrder(data.chapterId, data.swapChapterId, data.direction);
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
        this.documentFontSize = assistOS.constants.fontSizeMap[localStorage.getItem("document-title-font-size") || "24px"];
        this.documentFontFamily = assistOS.constants.fontFamilyMap[localStorage.getItem("document-font-family")] || "Arial";
        this.infoTextFontFamily = this.documentFontFamily
        this.infoTextFontSize = assistOS.constants.fontSizeMap[localStorage.getItem("infoText-font-size") || "16px"];
        this.chaptersContainer = "";
        this.docTitle = this._document.title;
        if (this._document.chapters.length > 0) {
            this._document.chapters.forEach((item) => {
                this.chaptersContainer += `<chapter-item data-chapter-id="${item.id}" data-presenter="chapter-item"></chapter-item>`;
            });
        }
        this.hasTableOfContents = this._document.hasTableOfContents || false;
        document.documentElement.style.setProperty('--document-font-color', localStorage.getItem("document-font-color") || "#646464");
        await this.refreshVariables();
    }
    async refreshVariables(){
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
            setTimeout(()=>{
                infoText.style.height = infoText.scrollHeight + 'px';
            },0)
        });
    }

    async afterRender() {
        let documentPluginsContainer = this.element.querySelector(".document-plugins-container");
        await pluginUtils.renderPluginIcons(documentPluginsContainer, "document");
        let infoTextPluginsContainer = this.element.querySelector(".infoText-plugins-container");
        await pluginUtils.renderPluginIcons(infoTextPluginsContainer, "infoText");
        this.renderDocumentTitle();
        this.renderInfoText();
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
        let snapshotsButton = this.element.querySelector(".document-snapshots-modal");
        let scriptArgs = this.element.querySelector(".script-modal");
        let buildIcon = this.element.querySelector(".build-document");
        this.attachTooltip(this.undoButton, "Undo");
        this.attachTooltip(this.redoButton, "Redo");
        this.attachTooltip(tasksMenu, "Tasks");
        this.attachTooltip(snapshotsButton, "Snapshots");
        this.attachTooltip(scriptArgs, "Run Script");
        this.attachTooltip(buildIcon, "Build Document");
    }
    async openSnapshotsModal(targetElement) {
        await assistOS.UI.showModal("document-snapshots-modal");
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

    async moveChapter(targetElement, direction) {
        const currentChapterElement = assistOS.UI.reverseQuerySelector(targetElement, "chapter-item");
        const currentChapterId = currentChapterElement.getAttribute('data-chapter-id');
        const currentChapterIndex = this._document.getChapterIndex(currentChapterId);

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
    async openScriptModal(){
        await assistOS.UI.showModal("run-script");
    }
    async saveInfoText(infoTextElement) {
        let infoText = assistOS.UI.sanitize(infoTextElement.value);
        if (infoText !== this._document.infoText) {
            this._document.infoText = infoText;
            await documentModule.updateDocument(assistOS.space.id, this._document.id,
                this._document.title,
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
    }

    async addParagraphTable(targetElement, mode) {
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
            await documentModule.updateDocument(assistOS.space.id, this._document.id,
                titleText,
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
        let pluginContainer = this.element.querySelector(`.paragraph-plugin-container`);
        let pluginElement = pluginContainer.firstElementChild;
        if(!pluginElement){
            return;
        }
        if(pluginElement.classList.contains("pinned")){
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
        await selectionUtils.deselectItem(itemId, this);
        delete this.currentSelectItem;
    }

    async controlInfoTextHeight(infoText) {
        infoText.style.height = "auto";
        infoText.style.height = infoText.scrollHeight + 'px';
    }
    changeToolbarView(targetElement, mode) {
        let containerElement = targetElement.closest(".container-element");
        let toolbar = containerElement.querySelector(".right-section");
        if(!toolbar){
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
        await selectionUtils.selectItem(true, this.infoTextId, this.infoTextClass, this);
        this.currentSelectItem = this.infoTextId;
        this.changeToolbarView(targetElement, "on");
        if(this.currentPlugin){
            await this.openPlugin("", "infoText", this.currentPlugin);
        }
    }
    async highlightInfoTextTitle(targetElement) {
        await this.changeCurrentElement(targetElement, this.focusOutHandler.bind(this, targetElement, this.infoTextTitleId));
        let containerElement = targetElement.closest(".container-element");
        containerElement.classList.add("focused");
        targetElement.classList.add("focused")
        await selectionUtils.selectItem(true, this.infoTextTitleId, this.infoTextClass, this);
        this.currentSelectItem = this.infoTextTitleId;
        this.changeToolbarView(targetElement, "on");
        if(this.currentPlugin){
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
            await this.changeCurrentElement(targetElement, this.focusOutHandlerTitle.bind(this, targetElement, this.titleId));
            targetElement.addEventListener('keydown', this.titleKeyDownHandler);
            saveFunction = this.saveTitle.bind(this, targetElement);
            await selectionUtils.selectItem(true, this.titleId, this.titleClass, this);
            this.currentSelectItem = this.titleId;
        } else if (type === "infoText") {
            await this.highlightInfoText(targetElement);
            saveFunction = this.saveInfoText.bind(this, targetElement);
        }else if (type === "infoTextTitle") {
            await this.highlightInfoTextTitle(targetElement);
            saveFunction = this.saveInfoTextTitle.bind(this, targetElement);
        }
        else if (type === "chapterTitle") {
            targetElement.classList.add("focused")
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            saveFunction = chapterPresenter.saveTitle.bind(chapterPresenter, targetElement);
            await this.changeCurrentElement(targetElement, chapterPresenter.focusOutHandlerTitle.bind(chapterPresenter, targetElement));
            await chapterPresenter.highlightChapter();
            await chapterPresenter.highlightChapterHeader();
            targetElement.addEventListener('keydown', this.titleKeyDownHandler.bind(this, targetElement));
            await selectionUtils.selectItem(true, chapterPresenter.titleId, chapterPresenter.titleClass, chapterPresenter);
        } else if(type === "chapterHeader"){
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            await this.changeCurrentElement(targetElement, chapterPresenter.focusOutHandlerTitle.bind(chapterPresenter, targetElement));
            await chapterPresenter.highlightChapter();
            await chapterPresenter.highlightChapterHeader();
            await selectionUtils.selectItem(true, chapterPresenter.titleId, chapterPresenter.titleClass, chapterPresenter);
        }else if (type === "paragraphText") {
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
        } else if(type === "infoText"){
            let itemId = `${this.infoTextId}_${pluginName}`;
            let context = {
                infoText: ""
            }
            await pluginUtils.openPlugin(pluginName, "infoText", context, this, itemId);
        }
    }

    closePlugin(targetElement, focusoutClose) {
        let pluginContainer = this.element.querySelector(`.infoText-plugin-container`);
        pluginContainer.classList.remove("plugin-open");
        let pluginElement = pluginContainer.firstElementChild;
        if(!pluginElement){
            return;
        }
        let pluginName = pluginElement.tagName.toLowerCase();
        pluginElement.remove();
        pluginUtils.removeHighlightPlugin("infoText", this);
        if(focusoutClose){
            return pluginName;
        }
    }

    async undoOperation(targetElement){
        this.toggleEditingState(false);
        let success = await documentModule.undoOperation(assistOS.space.id, this._document.id);
        if(success){
            assistOS.showToast("Undo successful.", "success");
        } else {
            assistOS.showToast("Nothing to undo.", "info");
            this.toggleEditingState(true);
        }
    }
    async redoOperation(targetElement){
        this.toggleEditingState(false);
        let success = await documentModule.redoOperation(assistOS.space.id, this._document.id);
        if(success){
            assistOS.showToast("Redo successful.", "success");
        } else {
            assistOS.showToast("Nothing to redo.", "info");
            this.toggleEditingState(true);
        }
    }
    async buildForDocument(button){
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
}
