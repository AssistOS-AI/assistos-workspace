import {NotificationRouter} from "../../../../imports.js";
const documentModule = require("assistos").loadModule("document", {});
const personalityModule = require("assistos").loadModule("personality", {});
import {executorTimer, unescapeHtmlEntities} from "../../../../imports.js";

export class DocumentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.refreshDocument = async () => {
            this._document = await documentModule.getDocument(assistOS.space.id, this._document.id);
        }
        this.invalidate(async () => {
            this._document = await documentModule.getDocument(assistOS.space.id, window.location.hash.split("/")[3]);
            this.boundOnDocumentUpdate = this.onDocumentUpdate.bind(this);
            await NotificationRouter.subscribeToSpace(assistOS.space.id, this._document.id, this.boundOnDocumentUpdate);
            this.personalitiesMetadata = await personalityModule.getPersonalitiesMetadata(assistOS.space.id);
            this.boundRefreshPersonalitiesMetadata = this.refreshPersonalitiesMetadata.bind(this);
            await NotificationRouter.subscribeToSpace(assistOS.space.id, "personalities", this.boundRefreshPersonalitiesMetadata);
        });
    }
    async refreshPersonalitiesMetadata() {
        this.personalitiesMetadata = await personalityModule.getPersonalitiesMetadata(assistOS.space.id);
    }
    async insertNewChapter(chapterId, position) {
        let newChapter = await documentModule.getChapter(assistOS.space.id, this._document.id, chapterId);
        this._document.chapters.splice(position, 0, newChapter);
        let previousChapterIndex = position - 1;
        if(previousChapterIndex < 0){
            previousChapterIndex = 0;
        }
        let previousChapterId = this._document.chapters[previousChapterIndex].id;
        let previousChapter = this.element.querySelector(`chapter-item[data-chapter-id="${previousChapterId}"]`);
        if(!previousChapter){
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
            if(adjacentChapterIndex === this._document.chapters.length - 1){
                chapters.push(chapters.shift());
                let newIndex = this._document.chapters.length;
                chapter1.setAttribute("data-chapter-number", newIndex);
                chapter2.insertAdjacentElement('afterend', chapter1);
                return;
            }
            [chapters[currentChapterIndex], chapters[adjacentChapterIndex]] = [chapters[adjacentChapterIndex], chapters[currentChapterIndex]];
            let newIndex = adjacentChapterIndex + 1;
            chapter1.setAttribute("data-chapter-number", newIndex);
            chapter2.insertAdjacentElement('beforebegin', chapter1);
        } else {
            // Insert the current chapter after the adjacent one
            if(adjacentChapterIndex === 0){
                chapters.unshift(chapters.pop());
                let newIndex = 1;
                chapter1.setAttribute("data-chapter-number", newIndex);
                chapter2.insertAdjacentElement('beforebegin', chapter1);
                return;
            }
            [chapters[currentChapterIndex], chapters[adjacentChapterIndex]] = [chapters[adjacentChapterIndex], chapters[currentChapterIndex]];
            let newIndex = adjacentChapterIndex + 1;
            chapter1.setAttribute("data-chapter-number", newIndex);
            chapter2.insertAdjacentElement('afterend', chapter1);
        }
        let allChapters = this.element.querySelectorAll("chapter-item");
        for(let chapter of allChapters){
            chapter.webSkelPresenter.updateChapterNumber();
        }
    }
    deleteChapter(chapterId) {
        let chapter = this.element.querySelector(`chapter-item[data-chapter-id="${chapterId}"]`);
        chapter.remove();
        this._document.chapters = this._document.chapters.filter((chapter) => chapter.id !== chapterId);
    }
    async onDocumentUpdate(data){
        if(typeof data === "object"){
            if(data.operationType === "add"){
                await this.insertNewChapter(data.chapterId, data.position);
                return;
            }
            if(data.operationType === "delete"){
                this.deleteChapter(data.chapterId);
                return;
            }
            if(data.operationType === "swap"){
                this.swapChapters(data.chapterId, data.swapChapterId, data.direction);
                return;
            }
        }
        switch (data) {
            case "delete":
                await this.openDocumentsPage();
                alert("The document has been deleted");
                return;
            case "title":
                let title = await documentModule.getDocumentTitle(assistOS.space.id, this._document.id);
                this._document.title = title;
                this.renderDocumentTitle();
                return;
            case "abstract":
                let abstract = await documentModule.getDocumentAbstract(assistOS.space.id, this._document.id);
                this._document.abstract = abstract;
                this.renderAbstract();
                return;
            default:
                return this.invalidate(this.refreshDocument);
        }
    }

    beforeRender() {
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
    }

    renderDocumentTitle() {
        let documentTitle = this.element.querySelector(".document-title");
        documentTitle.value = unescapeHtmlEntities(this._document.title);
    }

    renderAbstract() {
        let abstract = this.element.querySelector(".abstract-text");
        abstract.innerHTML = this._document.abstract || "No abstract has been set or generated for this document";
    }

    afterRender() {
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
            await assistOS.callFlow("UpdateAbstract", {
                spaceId: assistOS.space.id,
                documentId: this._document.id,
                text: abstractText
            });
        }
    }

    async addChapter(targetElement, mode) {
        let position = this._document.chapters.length;
        if (assistOS.space.currentChapterId) {
            if (mode === "above") {
                position = this._document.chapters.findIndex(
                    (chapter) => chapter.id === assistOS.space.currentChapterId);

            } else {
                position = this._document.chapters.findIndex(
                    (chapter) => chapter.id === assistOS.space.currentChapterId) + 1;
            }

        }
        let chapterData = {title: "New Chapter", paragraphs: []};
        chapterData.position = position;
        let chapterId = await documentModule.addChapter(assistOS.space.id, this._document.id, chapterData);
        await documentModule.addParagraph(assistOS.space.id, this._document.id, chapterId, {
            text: "",
            position: 0,
            commands: {}
        });
        await this.insertNewChapter(chapterId, position);
    }

    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/documents-page`);
    }

    async saveTitle(textElement) {
        let titleText = assistOS.UI.sanitize(textElement.value);
        if (titleText !== this._document.title && titleText !== "") {
            this._document.title = titleText;
            await assistOS.callFlow("UpdateDocumentTitle", {
                spaceId: assistOS.space.id,
                documentId: this._document.id,
                title: titleText
            });
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

    focusOutHandler(element) {
        let container = element.closest(".container-element");
        container.classList.remove("focused");
        element.removeEventListener('keydown', this.titleKeyDownHandler);
        element.removeEventListener('keydown', this.boundControlAbstractHeight);
        element.classList.remove("focused");

        this.stopTimer.bind(this, true);
    }

    async controlAbstractHeight(abstract) {
        abstract.style.height = "auto";
        abstract.style.height = abstract.scrollHeight + 'px';
    }

    async editItem(targetElement, type) {
        if (targetElement.getAttribute("id") === "current-selection") {
            return;
        }
        if(type === "paragraph"){
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            let paragraphItem = targetElement.closest("paragraph-item");
            let paragraphText = paragraphItem.querySelector(".paragraph-text");
            let paragraphPresenter = paragraphItem.webSkelPresenter;
            await this.changeCurrentElement(paragraphItem, paragraphPresenter.focusOutHandler.bind(paragraphPresenter, paragraphText));
            await paragraphPresenter.highlightParagraph();
            await chapterPresenter.highlightChapter();
            return;
        }
        let saveFunction;
        let resetTimerFunction = this.resetTimer.bind(this);
        if (type === "title") {
            targetElement.classList.add("focused");
            let containerElement = targetElement.closest(".container-element");
            containerElement.classList.add("focused");
            await this.changeCurrentElement(targetElement, this.focusOutHandler.bind(this, targetElement));
            targetElement.addEventListener('keydown', this.titleKeyDownHandler);
            saveFunction = this.saveTitle.bind(this, targetElement);
        } else if (type === "abstract") {
            if (!this.boundControlAbstractHeight) {
                this.boundControlAbstractHeight = this.controlAbstractHeight.bind(this, targetElement);
            }
            let containerElement = targetElement.closest(".container-element");
            containerElement.classList.add("focused");
            targetElement.classList.add("focused")
            targetElement.addEventListener('keydown', this.boundControlAbstractHeight);
            await this.changeCurrentElement(targetElement, this.focusOutHandler.bind(this, targetElement));
            saveFunction = this.saveAbstract.bind(this, targetElement);
        } else if (type === "chapterTitle") {
            targetElement.classList.add("focused")
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            saveFunction = chapterPresenter.saveTitle.bind(chapterPresenter, targetElement);
            await this.changeCurrentElement(targetElement, chapterPresenter.focusOutHandlerTitle.bind(chapterPresenter, targetElement));
            await chapterPresenter.highlightChapter();
            targetElement.addEventListener('keydown', this.titleKeyDownHandler.bind(this, targetElement));
        } else if (type === "paragraphText") {
            let chapterPresenter = targetElement.closest("chapter-item").webSkelPresenter;
            let paragraphItem = targetElement.closest("paragraph-item");
            let paragraphPresenter = paragraphItem.webSkelPresenter;
            await this.changeCurrentElement(targetElement, paragraphPresenter.focusOutHandler.bind(paragraphPresenter, targetElement));
            await chapterPresenter.highlightChapter();
            paragraphPresenter.highlightParagraph();
            saveFunction = paragraphPresenter.saveParagraph.bind(paragraphPresenter, targetElement);
            resetTimerFunction = paragraphPresenter.resetTimer.bind(paragraphPresenter, targetElement);
        }
        targetElement.focus();
        if (this.timer) {
            await this.timer.stop(true);
        }
        this.setContext();
        this.timer = new executorTimer(saveFunction, 10000);
        targetElement.addEventListener("keydown", resetTimerFunction);
    }

    async documentToVideo(button) {
        let videoId = await documentModule.documentToVideo(assistOS.space.id, this._document.id);
        assistOS.space.notifyObservers(this._document.id + "/tasks");
       /* await utilModule.subscribeToObject(videoId, async (data) => {
            if (data.error) {
                return await showApplicationError("Error compiling video", data.error, "");
            } else if (data.status === "completed") {
                const a = document.createElement("a");
                a.href = `/spaces/videos/${assistOS.space.id}/${videoId}`;
                a.download = "video.mp4";
                document.body.appendChild(a);
                a.click();
                a.remove();
                this.invalidate(this.refreshDocument);
            }
        });*/
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

    playVideoPreview(targetElement) {
        let videoPlayer = `<document-video-preview class="minimized" data-presenter="document-video-preview"></document-video-preview>`;
        let pageHeader = this.element.querySelector(".document-page-header");
        pageHeader.insertAdjacentHTML("afterend", videoPlayer);
    }

    toggleEditingState(isEditable) {
        let documentEditor = this.element.querySelector(".document-editor");
        let disabledMask = this.element.querySelector(".disabled-mask");
        if (!isEditable) {
            disabledMask.style.display = "block";
            documentEditor.classList.add("disabled-editor");
        } else {
            documentEditor.classList.remove("disabled-editor");
            disabledMask.style.display = "none";
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

    async openGenerateBookModal(_target) {
        await assistOS.UI.showModal("books-generator-modal", {
            "presenter": "books-generator-modal",
            "documentId": this._document.id
        });
    }
}
