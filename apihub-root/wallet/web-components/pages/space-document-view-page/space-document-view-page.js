const spaceAPIs = require("assistos").loadModule("space", {});
const {notificationService} = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});
import {insertTextAtCursor, saveCaretPosition, getCursorPositionTextIndex} from "../../../imports.js";
export class SpaceDocumentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.refreshDocument = async () => {
            let documentData = await documentModule.getDocument(assistOS.space.id, this._document.id);
            this._document = new documentModule.Document(documentData);
        }
        this.refreshDocumentTitle = async () => {
            await this._document.refreshDocumentTitle(assistOS.space.id, this._document.id);
        };
        this.refreshDocumentAbstract = async () => {
            await this._document.refreshDocumentAbstract(assistOS.space.id, this._document.id);
        };
        this.invalidate(async () => {
            let documentData = await documentModule.getDocument(assistOS.space.id, window.location.hash.split("/")[3]);
            this._document = new documentModule.Document(documentData);
            await spaceAPIs.subscribeToObject(assistOS.space.id, this._document.id);
            notificationService.on(this._document.id + "/delete", async () => {
                await this.openDocumentsPage();
                alert("The document has been deleted");
            });
            notificationService.on(this._document.id, () => {
                this.invalidate(this.refreshDocument);
            });
            notificationService.on("title", () => {
                this.invalidate(this.refreshDocumentTitle);
            });
            notificationService.on("abstract", () => {
                this.invalidate(this.refreshDocumentAbstract);
            });
            spaceAPIs.startCheckingUpdates(assistOS.space.id);
        });

        this.controller = new AbortController();
        this.boundedFn = this.highlightElement.bind(this, this.controller);
        document.removeEventListener("click", this.boundedFn);
        document.addEventListener("click", this.boundedFn, {signal: this.controller.signal});
    }

    beforeRender() {
        this.chaptersContainer = "";
        this.docTitle = this._document.title;
        this.abstractText = this._document.abstract || "No abstract has been set or generated for this document";
        if (this._document.chapters.length > 0) {
            let iterator = 0;
            this._document.chapters.forEach((item) => {
                iterator++;
                this.chaptersContainer += `<space-chapter-unit data-chapter-number="${iterator}" data-chapter-id="${item.id}" data-metadata="chapter nr. ${iterator} with title ${item.title} and id ${item.id}" data-title-metadata="title of the current chapter" data-presenter="space-chapter-unit"></space-chapter-unit>`;
            });
        }
    }
   afterRender() {
        let buttonsSection = this.element.querySelector(".buttons-section");
        if(!this.boundSaveSelectionHandler){
            this.boundSaveSelectionHandler = this.saveSelectionHandler.bind(this);
            buttonsSection.addEventListener("mousedown", this.boundSaveSelectionHandler);
        }
   }
    saveSelectionHandler(event){
        let {chapter, paragraph} = this.getSelectedParagraphAndChapter();
        if(!chapter){
            return;
        }
        let paragraphUnit = this.element.querySelector(`space-paragraph-unit[data-paragraph-id="${paragraph.id}"]`);
        let paragraphText = paragraphUnit.querySelector(".paragraph-text");
        this.restoreSelectionFn = saveCaretPosition(paragraphText);
    }
    async afterUnload() {
        await spaceAPIs.unsubscribeFromObject(assistOS.space.id, this._document.id);
        spaceAPIs.stopCheckingUpdates(assistOS.space.id);
    }

    async deleteChapter(_target) {
        let chapter = assistOS.UI.reverseQuerySelector(_target, "space-chapter-unit");
        let chapterId = chapter.getAttribute("data-chapter-id");
        await assistOS.callFlow("DeleteChapter", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: chapterId
        });
    }

    async highlightElement(controller, event) {
        let leftSideBarItem = assistOS.UI.getClosestParentElement(event.target, ".feature");
        let rightSideBarItem = assistOS.UI.getClosestParentElement(event.target, ".sidebar-item");
        if (leftSideBarItem || rightSideBarItem) {
            controller.abort();
        }
        this.setContext();
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

    deselectPreviousElements() {
        let previousHighlightedElement = document.querySelector("#highlighted-element");
        if (previousHighlightedElement) {
            previousHighlightedElement.removeAttribute("id");
        }
        let previousHighlightedChildElement = document.querySelector("#highlighted-child-element");
        if (previousHighlightedChildElement) {
            previousHighlightedChildElement.removeAttribute("id");
        }
    }


    async moveChapter(_target, direction) {
        const currentChapter = assistOS.UI.reverseQuerySelector(_target, "space-chapter-unit");
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
    }


    editTitle(title) {
        const titleEnterHandler = async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        };
        if (title.getAttribute("contenteditable") === "false") {
            this.deselectPreviousElements();
            title.setAttribute("contenteditable", "true");
            title.addEventListener('keydown', titleEnterHandler);
            title.focus();
            title.parentElement.setAttribute("id", "highlighted-element");
            let timer = assistOS.services.SaveElementTimer(async () => {
                let titleText = assistOS.UI.sanitize(assistOS.UI.customTrim(title.innerText));
                if (!titleText) {
                    titleText = "";
                }
                if (titleText !== this._document.title && titleText !== "") {
                    await assistOS.callFlow("UpdateDocumentTitle", {
                        spaceId: assistOS.space.id,
                        documentId: this._document.id,
                        title: titleText
                    });
                }
            }, 1000);
            title.addEventListener("focusout", async (event) => {
                title.innerText = assistOS.UI.customTrim(title.innerText) || assistOS.UI.unsanitize(this._document.title);
                await timer.stop(true);
                title.setAttribute("contenteditable", "false");
                title.removeEventListener('keydown', titleEnterHandler);
                title.removeEventListener("keydown", resetTimer);
                let agentPage = document.getElementById("agent-page");
                if (event.relatedTarget) {
                    if ((event.relatedTarget.getAttribute("id") !== "agent-page") && !agentPage.contains(event.relatedTarget)) {
                        title.parentElement.removeAttribute("id");
                    }
                } else {
                    title.parentElement.removeAttribute("id");
                }

            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            title.addEventListener("keydown", resetTimer);
        }
    }

    async editAbstract(abstract) {
        if (abstract.getAttribute("contenteditable") === "false") {
            this.deselectPreviousElements();
            let abstractSection = assistOS.UI.reverseQuerySelector(abstract, ".abstract-section");
            abstract.setAttribute("contenteditable", "true");
            abstract.focus();
            abstractSection.setAttribute("id", "highlighted-element");
            let timer = assistOS.services.SaveElementTimer(async () => {
                let abstractText = assistOS.UI.sanitize(assistOS.UI.customTrim(abstract.innerText));
                if (!abstractText) {
                    abstractText = "";
                }
                if (abstractText !== this._document.abstract && abstractText !== "") {
                    await assistOS.callFlow("UpdateAbstract", {
                        spaceId: assistOS.space.id,
                        documentId: this._document.id,
                        text: abstractText
                    });
                }
            }, 1000);

            abstract.addEventListener("blur", async (event) => {
                abstract.innerText = assistOS.UI.customTrim(abstract.innerText) || assistOS.UI.unsanitize(this._document.abstract);
                abstract.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                abstract.setAttribute("contenteditable", "false");
                let agentPage = document.getElementById("agent-page");
                if (event.relatedTarget) {
                    if ((event.relatedTarget.getAttribute("id") !== "agent-page") && !agentPage.contains(event.relatedTarget)) {
                        abstractSection.removeAttribute("id");
                    }
                } else {
                    abstractSection.removeAttribute("id");
                }
                if (event.relatedTarget) {
                    if (event.relatedTarget.getAttribute("id") !== "agent-page") {
                        abstractSection.removeAttribute("id");
                    }
                } else {
                    abstractSection.removeAttribute("id");
                }
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            abstract.addEventListener("keydown", resetTimer);
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
        let chapterId = await assistOS.callFlow("AddChapter", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            position: position
        });
        assistOS.space.currentChapterId = chapterId;
    }

    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/Space/space-documents-page`);
    }

    getSelectedParagraphAndChapter(){
        let chapter;
        let paragraph;
        if (assistOS.space.currentParagraphId) {
            chapter = this._document.getChapter(assistOS.space.currentChapterId);
            paragraph = this.chapter.getParagraph(assistOS.space.currentParagraphId);
        } else if(assistOS.space.currentChapterId){
            chapter = this._document.getChapter(assistOS.space.currentChapterId);
            paragraph = chapter.paragraphs[this.chapter.paragraphs.length - 1];
        } else {
            if(this._document.chapters.length === 0){
                return {chapter, paragraph};
            }
            chapter = this._document.chapters[this._document.chapters.length - 1];
            paragraph = chapter.paragraphs[chapter.paragraphs.length - 1];
        }
        return {chapter, paragraph};
    }
    async openInsertImageModal(_target) {
        let {chapter, paragraph} = this.getSelectedParagraphAndChapter();
        let imagesData = await assistOS.UI.showModal("insert-image-modal", {["chapter-id"]: chapter.id}, true);
        this.restoreSelectionFn();
        if(imagesData){
            let index = getCursorPositionTextIndex();
            await assistOS.callFlow("AddImagesToParagraph", {
                spaceId: assistOS.space.id,
                documentId: this._document.id,
                chapterId: chapter.id,
                paragraphId: paragraph.id,
                offset: index,
                imagesData: imagesData
            });
        }
    }
}