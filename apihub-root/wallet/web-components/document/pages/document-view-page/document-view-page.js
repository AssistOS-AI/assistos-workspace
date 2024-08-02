const spaceModule = require("assistos").loadModule("space", {});
const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});
import {executorTimer, saveCaretPosition, unescapeHtmlEntities} from "../../../../imports.js";

export class DocumentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.refreshDocument = async () => {
            let documentData = await documentModule.getDocument(assistOS.space.id, this._document.id);
            this._document = new documentModule.Document(documentData);
        }
        this.childrenSubscriptions = new Map();
        this.invalidate(async () => {
            let documentData = await documentModule.getDocument(assistOS.space.id, window.location.hash.split("/")[3]);
            this._document = new documentModule.Document(documentData);
            await utilModule.subscribeToObject(this._document.id, async (type) => {
                switch (type) {
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
            });
        });
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
    renderAbstract(){
        let abstract = this.element.querySelector(".abstract-text");
        abstract.innerHTML = this._document.abstract || "No abstract has been set or generated for this document";
    }
    afterRender() {
        this.renderDocumentTitle();
        this.renderAbstract();
        if(assistOS.space.currentChapterId){
            let chapter = this.element.querySelector(`chapter-item[data-chapter-id="${assistOS.space.currentChapterId}"]`);
            if(chapter){
                chapter.click();
                chapter.scrollIntoView({behavior: "smooth", block: "center"});
            }
        }
        if(this._document.video){
            this.insertVideoSection(this._document.video);
        }
    }

    async afterUnload() {
        await utilModule.unsubscribeFromObject(this._document.id);
        for(let childId of this.childrenSubscriptions.keys()){
            await utilModule.unsubscribeFromObject(childId);
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

    async moveChapter(_target, direction) {
        const currentChapter = assistOS.UI.reverseQuerySelector(_target, "chapter-item");
        const currentChapterId = currentChapter.getAttribute('data-chapter-id');
        const currentChapterIndex = this._document.getChapterIndex(currentChapterId);

        const getAdjacentChapterId = (index, chapters) => {
            if (direction === "up") {
                return index === 0 ? chapters[chapters.length - 1].id : chapters[index - 1].id;
            }
            return index === chapters.length - 1 ? chapters[0].id : chapters[index + 1].id;
        };

        const adjacentChapterId = getAdjacentChapterId(currentChapterIndex, this._document.chapters);
        await assistOS.callFlow("SwapChapters", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId1: currentChapterId,
            chapterId2: adjacentChapterId
        });
        this.invalidate(this.refreshDocument);
    }
    async saveAbstract(abstractElement){
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

    async addChapter() {
        let position = this._document.chapters.length;
        // Find the position to add the new chapter
        if (assistOS.space.currentChapterId) {
            position = this._document.chapters.findIndex(
                (chapter) => chapter.id === assistOS.space.currentChapterId
            ) + 1;
        }
        assistOS.space.currentChapterId = (await assistOS.callFlow("AddChapter", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            position: position
        })).data;
        this.invalidate(this.refreshDocument);
    }

    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/documents-page`);
    }

    async saveTitle(textElement){
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
        if(this.currentElement){
            this.currentElement.element.removeAttribute("id");
            this.currentElement.containerElement.removeAttribute("id");
            await this.currentElement.focusoutFunction(this.currentElement.element);
            await this.stopTimer(true);
        }
        element.setAttribute("id", "current-selection");
        let containerElement = element.closest(".container-element");
        containerElement.setAttribute("id", "current-selection-parent");
        this.currentElement = {
            element: element,
            containerElement: containerElement,
            focusoutFunction: focusoutFunction
        };
    }
    async titleKeyDownHandler(event){
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    };
    async resetTimer(){
        await this.timer.reset(1000);
    }
    async stopTimer(executeFn){
        if(this.timer){
            await this.timer.stop(executeFn);
        }
    }
    focusOutHandler(element){
        element.removeEventListener('keydown', this.titleKeyDownHandler);
        element.removeEventListener('keydown', this.boundControlAbstractHeight);
        this.stopTimer.bind(this, true);
    }
    async controlAbstractHeight(abstract){
        abstract.style.height = "auto";
        abstract.style.height = abstract.scrollHeight + 'px';
    }
    async editItem(_target, type) {
        if(_target.hasAttribute("id") && _target.getAttribute("id") === "current-selection"){
            return;
        }
        let saveFunction;
        let resetTimerFunction = this.resetTimer.bind(this);
        if(type === "title"){
            await this.changeCurrentElement(_target, this.focusOutHandler.bind(this, _target));
            _target.addEventListener('keydown', this.titleKeyDownHandler);
            saveFunction = this.saveTitle.bind(this, _target);
        }else if(type === "abstract"){
            if(!this.boundControlAbstractHeight){
                this.boundControlAbstractHeight = this.controlAbstractHeight.bind(this, _target);
            }
            _target.addEventListener('keydown', this.boundControlAbstractHeight);
            await this.changeCurrentElement(_target, this.focusOutHandler.bind(this, _target));
            saveFunction = this.saveAbstract.bind(this, _target);
        } else if(type === "chapterTitle"){
            let chapterPresenter = _target.closest("chapter-item").webSkelPresenter;
            saveFunction = chapterPresenter.saveTitle.bind(chapterPresenter, _target);
            await this.changeCurrentElement(_target, chapterPresenter.focusOutHandler.bind(chapterPresenter));
            await chapterPresenter.highlightChapter(_target);
            _target.addEventListener('keydown', this.titleKeyDownHandler.bind(this, _target));
        } else if(type === "paragraph"){
            let chapterPresenter = _target.closest("chapter-item").webSkelPresenter;
            let paragraphItem = _target.closest("paragraph-item") || _target.closest("image-paragraph");
            let paragraphPresenter = paragraphItem.webSkelPresenter;
            await this.changeCurrentElement(_target, paragraphPresenter.focusOutHandler.bind(paragraphPresenter));
            await chapterPresenter.highlightChapter(_target);
            paragraphPresenter.highlightParagraph();
            saveFunction = paragraphPresenter.saveParagraph.bind(paragraphPresenter, _target);
            resetTimerFunction = paragraphPresenter.resetTimer.bind(paragraphPresenter, _target);
        }
        _target.focus();
        if(this.timer){
            await this.timer.stop(true);
        }
        this.setContext();
        this.timer = new executorTimer(saveFunction,1000);
        _target.addEventListener("keydown", resetTimerFunction);
    }
    async documentToVideo(button){
        this.videoId = (await assistOS.callFlow("DocumentToVideo", {
            spaceId: assistOS.space.id,
            documentId: this._document.id
        })).data;
        await utilModule.subscribeToObject(this.videoId, async (data) => {
            if(data){
                if(data.error){
                    button.innerHTML = "Document to Video";
                    button.setAttribute("data-local-action", "documentToVideo");
                    return await showApplicationError("Error compiling video", data.error, "");
                }
            }
            delete this.videoId;
            this.invalidate(this.refreshDocument);
        });
        button.innerHTML = `<div class="loading-mask"></div>`
        button.setAttribute("data-local-action", "cancelVideoCompilation");
    }
    async cancelVideoCompilation(button){
        try{
            await spaceModule.cancelTask(assistOS.space.id, this.videoId);
            button.innerHTML = "Document to Video";
            button.setAttribute("data-local-action", "documentToVideo");
        } catch (e) {
            await showApplicationError("Error cancelling video compilation", e.message, "");
        }
    }
    insertVideoSection(videoURL){
        let videoSection = this.element.querySelector(".document-video");
        if(videoSection){
            videoSection.remove();
        }
        let section = this.element.querySelector(".document-page-header");
        section.insertAdjacentHTML("afterend", `
            <video class="document-video" controls>
                <source src="${videoURL}" type="video/mp4">
            </video>`);
    }
    async exportDocument(_target) {
        try {
            const response = await fetch(`/spaces/${assistOS.space.id}/export/documents/${this._document.id}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${this._document.id}.docai`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }

}