export class SpaceDocumentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.refreshDocument = async () =>{
            this._document = assistOS.space.getDocument(this._document.id);
        }
        this.invalidate(async ()=>{
            this._document = await assistOS.space.getDocument(window.location.hash.split("/")[3]);
            this._document.observeChange(this._document.getNotificationId() + ":document-view-page", invalidate, this.refreshDocument);
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
    }

    async deleteChapter(_target) {
        let chapter = assistOS.UI.reverseQuerySelector(_target, "space-chapter-unit");
        let chapterId = chapter.getAttribute("data-chapter-id");
        await assistOS.callFlow("DeleteChapter", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: chapterId
        });
        this.invalidate(this.refreshDocument);
    }

    switchParagraphArrows(target, mode) {
        if (this.chapter.paragraphs.length <= 1) {
            return;
        }
        let foundElement = target.querySelector('.paragraph-arrows');
        if (!foundElement) {
            let nextSibling = target.nextElementSibling;
            while (nextSibling) {
                if (nextSibling.matches('.paragraph-arrows')) {
                    foundElement = nextSibling;
                    break;
                }
                nextSibling = nextSibling.nextElementSibling;
            }
        }
        if (mode === "on") {
            foundElement.style.visibility = "visible";
        } else {
            foundElement.style.visibility = "hidden";
        }
    }

    saveParagraph(paragraph, event, swapAction) {
        if (!swapAction) {
            assistOS.space.currentParagraph = null;
        }
        if (paragraph["timer"]) {
            paragraph["timer"].stop(true);
        }
        paragraph["paragraph"].removeEventListener("keydown", this.resetTimer);
        paragraph["paragraph"].setAttribute("contenteditable", "false");
        if (!assistOS.UI.getClosestParentElement(event.target, "agent-page")) {
            paragraph["paragraph"].removeAttribute("id");
        }
    }

    editParagraph(paragraph) {
        if (paragraph.getAttribute("contenteditable") === "false") {
            paragraph.setAttribute("contenteditable", "true");
            paragraph.setAttribute("id", "highlighted-child-element");
            let paragraphUnit = assistOS.UI.reverseQuerySelector(paragraph, ".paragraph-unit");
            paragraph.focus();
            this.previouslySelectedParagraph = {};
            this.previouslySelectedParagraph["paragraph"] = paragraph;
            this.switchParagraphArrows(paragraphUnit, "on");
            let currentParagraphId = paragraphUnit.getAttribute("data-paragraph-id");
            assistOS.space.currentParagraphId = currentParagraphId;
            let currentParagraph = this.chapter.getParagraph(currentParagraphId);

            let timer = assistOS.services.SaveElementTimer(async () => {
                if (!currentParagraph || assistOS.space.currentParagraphId !== currentParagraphId) {
                    await timer.stop();
                    return;
                }
                let paragraphText = assistOS.UI.sanitize(assistOS.UI.customTrim(paragraph.innerText));
                if (paragraphText !== currentParagraph.text) {
                    await assistOS.callFlow("UpdateParagraphText", {
                        spaceId: assistOS.space.id,
                        documentId: this._document.id,
                        chapterId: this.chapter.id,
                        paragraphId: currentParagraph.id,
                        text: paragraphText
                    });
                    this._document.notifyObservers(this._document.getNotificationId() + ":document-view-page:" + "chapter:" + `${this.chapter.id}`);
                }
            }, 1000);
            this.previouslySelectedParagraph["timer"] = timer;
            this.resetTimer = async (event) => {
                if (paragraph.innerText.trim() === "" && event.key === "Backspace") {
                    if (currentParagraph) {
                        let curentParagraphIndex = this.chapter.getParagraphIndex(currentParagraphId);
                        await assistOS.callFlow("DeleteParagraph", {
                            spaceId: assistOS.space.id,
                            documentId: this._document.id,
                            chapterId: this.chapter.id,
                            paragraphId: currentParagraphId
                        });
                        if (this.chapter.paragraphs.length > 0) {
                            if (curentParagraphIndex === 0) {
                                assistOS.space.currentParagraphId = this.chapter.paragraphs[0].id;
                            } else {
                                assistOS.space.currentParagraphId = this.chapter.paragraphs[curentParagraphIndex - 1].id;
                            }
                        } else {
                            assistOS.space.currentParagraphId = null;
                        }
                        this.invalidate(this.refreshDocument);
                    }
                    await timer.stop();
                } else {
                    await timer.reset(1000);
                }
            };
            paragraph.addEventListener("keydown", this.resetTimer);
        }
    }

    async highlightElement(controller, event) {
        this.chapterUnit = assistOS.UI.getClosestParentElement(event.target, ".chapter-unit");
        this.paragraphUnit = assistOS.UI.getClosestParentElement(event.target, ".paragraph-text");
        if (this.paragraphUnit) {
            /* clickul e pe un paragraf */
            if (this.chapterUnit.getAttribute("data-id") !== (this.previouslySelectedChapter?.getAttribute("data-id") || "")) {
                /* clickul e pe paragraf si un capitol diferit de cel curent */
                if (this.previouslySelectedParagraph) {
                    this.saveParagraph(this.previouslySelectedParagraph, event);
                }
                this.deselectPreviousParagraph();
                this.deselectPreviousChapter(event);
                await this.highlightChapter();
                this.editParagraph(this.paragraphUnit);
            } else {
                /* clickul e pe acelasi capitol dar alt paragraf*/
                if (this.paragraphUnit !== this.previouslySelectedParagraph["paragraph"]) {
                    /* clickul e pe un paragraf diferit de cel curent */
                    if (this.previouslySelectedParagraph) {
                        this.saveParagraph(this.previouslySelectedParagraph, event);
                    }
                    this.deselectPreviousParagraph();
                    this.editParagraph(this.paragraphUnit);
                } else {
                    /* clickul e pe acelasi paragraf */
                    return;
                }
            }
        } else if (this.chapterUnit) {
            /* clickul e pe un capitol si nu pe un paragraf*/
            if (this.chapterUnit !== this.previouslySelectedChapter) {
                /* clickul e pe un capitol diferit de cel curent si nu e pe un paragraf */
                this.deselectPreviousParagraph();
                this.deselectPreviousChapter(event);
                this.highlightChapter();
            } else {
                /* clickul e pe acelasi capitol dar nu pe un paragraf*/
                if (assistOS.UI.getClosestParentElement(event.target, ".paragraph-arrows")) {
                    /* clickul e pe un buton de swap */
                    if (this.previouslySelectedParagraph) {
                        this.saveParagraph(this.previouslySelectedParagraph, event, "swap");
                    }
                    if (assistOS.UI.getClosestParentElement(event.target, ".arrow-up") || assistOS.UI.getClosestParentElement(event.target, ".arrow-up-space")) {
                        await this.moveParagraph(this.previouslySelectedParagraph["paragraph"], "up")
                    } else {
                        await this.moveParagraph(this.previouslySelectedParagraph["paragraph"], "down")
                    }
                } else {
                    if (assistOS.UI.getClosestParentElement(event.target, ".chapter-arrows") && !event.target.classList.contains("delete-chapter")) {
                        /* clickul e pe un buton de swap al capitolului */
                        if (this.previouslySelectedParagraph) {
                            this.saveParagraph(this.previouslySelectedParagraph, event);
                        }
                        if (assistOS.UI.getClosestParentElement(event.target, ".arrow-up")) {
                            await this.moveChapter(event.target, "up");
                        } else {
                            await this.moveChapter(event.target, "down");
                        }
                    } else {
                        //this.saveParagraph(this.previouslySelectedParagraph, event);
                        this.deselectPreviousParagraph();
                    }
                }
            }
        } else {
            /* clickul e in afara unui capitol si in afara unui paragraf*/
            if (this.previouslySelectedParagraph) {
                this.saveParagraph(this.previouslySelectedParagraph, event);
            }
            this.deselectPreviousParagraph();
            this.deselectPreviousChapter(event);
            let leftSideBarItem = assistOS.UI.getClosestParentElement(event.target, ".feature");
            let rightSideBarItem = assistOS.UI.getClosestParentElement(event.target, ".sidebar-item");
            if (leftSideBarItem || rightSideBarItem) {
                controller.abort();
            }
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

    highlightChapter() {
        this.previouslySelectedChapter = this.chapterUnit;
        this.chapterUnit.setAttribute("id", "highlighted-element");
        this.switchArrowsDisplay(this.chapterUnit, "chapter", "on");
        let xMark = this.chapterUnit.querySelector(".delete-chapter");
        xMark.style.visibility = "visible";
        assistOS.space.currentChapterId = this.chapterUnit.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(assistOS.space.currentChapterId);
    }

    deselectPreviousParagraph() {
        if (this.previouslySelectedParagraph) {
            assistOS.space.currentParagraphId = null;
            this.previouslySelectedParagraph["paragraph"].setAttribute("contenteditable", "false");
            this.switchParagraphArrows(this.previouslySelectedParagraph["paragraph"], "off");
            delete this.previouslySelectedParagraph;
        }
    }

    deselectPreviousChapter(event) {
        if (this.previouslySelectedChapter) {
            let xMark = this.previouslySelectedChapter.querySelector(".delete-chapter");
            xMark.style.visibility = "hidden";
            this.switchArrowsDisplay(this.previouslySelectedChapter, "chapter", "off");
            if (!assistOS.UI.getClosestParentElement(event.target, "agent-page")) {
                this.previouslySelectedChapter.removeAttribute("id");
            }
            assistOS.space.currentChapterId = null;
            delete this.previouslySelectedChapter;
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

    switchArrowsDisplay(target, type, mode) {
        if (type === "chapter") {
            if (this._document.chapters.length <= 1) {
                return;
            }
        }
        if (type === "paragraph") {
            let chapter = this._document.getChapter(this.previouslySelectedChapter.getAttribute("data-chapter-id"));
            if (chapter.paragraphs.length <= 1) {
                return;
            }
        }
        const arrowsSelector = type === "chapter" ? '.chapter-arrows' : '.paragraph-arrows';
        let foundElement = target.querySelector(arrowsSelector);
        if (!foundElement) {
            let nextSibling = target.nextElementSibling;
            while (nextSibling) {
                if (nextSibling.matches(arrowsSelector)) {
                    foundElement = nextSibling;
                    break;
                }
                nextSibling = nextSibling.nextElementSibling;
            }
        }
        if (mode === "on") {
            foundElement.style.display = "flex";
        } else {
            foundElement.style.display = "none";
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
        this.invalidate(this.refreshDocument);
    }

    async moveParagraph(_target, direction) {
        let chapter = this._document.getChapter(assistOS.space.currentChapterId);
        const currentParagraph = assistOS.UI.reverseQuerySelector(_target, "space-paragraph-unit");
        const currentParagraphId = currentParagraph.getAttribute('data-paragraph-id');
        const currentParagraphIndex = chapter.getParagraphIndex(currentParagraphId);

        const getAdjacentParagraphId = (index, paragraphs) => {
            if (direction === "up") {
                return index === 0 ? paragraphs[paragraphs.length - 1].id : paragraphs[index - 1].id;
            }
            return index === paragraphs.length - 1 ? paragraphs[0].id : paragraphs[index + 1].id;
        };
        const adjacentParagraphId = getAdjacentParagraphId(currentParagraphIndex, chapter.paragraphs);
        const chapterId = assistOS.UI.reverseQuerySelector(_target, "space-chapter-unit").getAttribute('data-chapter-id');
        await assistOS.callFlow("SwapParagraphs", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: chapterId,
            paragraphId1: currentParagraphId,
            paragraphId2: adjacentParagraphId
        });
        this._document.notifyObservers(this._document.getNotificationId() + ":document-view-page:" + "chapter:" + `${chapterId}`);
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
                if (titleText !== this._document.title && titleText !== "") {
                    await assistOS.callFlow("UpdateDocumentTitle", {
                        spaceId: assistOS.space.id,
                        documentId: this._document.id,
                        title: titleText
                    });
                    this.invalidate(this.refreshDocument);
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
                if (abstractText !== this._document.abstract && abstractText !== "") {
                    await assistOS.callFlow("UpdateAbstract", {
                        spaceId: assistOS.space.id,
                        documentId: this._document.id,
                        text: abstractText
                    });
                    this.invalidate(this.refreshDocument);
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
        let [chapterId, paragraphId] = await assistOS.callFlow("AddChapter", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            position: position
        });
        assistOS.space.currentChapterId = chapterId;
        assistOS.space.currentParagraphId = paragraphId;
        this.invalidate(this.refreshDocument);

    }

    async addParagraph(_target) {
        let chapter = this._document.getChapter(assistOS.space.currentChapterId);
        let position = chapter.paragraphs.length;
        if (assistOS.space.currentParagraphId) {
            position = chapter.getParagraphIndex(assistOS.space.currentParagraphId) + 1;
        }
        assistOS.space.currentParagraphId = await assistOS.callFlow("AddParagraph", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: chapter.id,
            position: position
        });
        assistOS.space.currentChapterId = chapter.id;
        this._document.notifyObservers(this._document.getNotificationId() + ":document-view-page:" + "chapter:" + `${assistOS.space.currentChapterId}`);
    }

    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/SpaceConfiguration/space-documents-page`);
    }
}