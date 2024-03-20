export class SpaceDocumentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = system.space.getDocument(window.location.hash.split("/")[3]);
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page", invalidate);
        this._document.observeChange(this._document.getNotificationId() + ":refresh", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
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
                this.chaptersContainer += `<space-chapter-unit data-chapter-number="${iterator}" data-chapter-id="${item.id}" data-presenter="space-chapter-unit"></space-chapter-unit>`;
            });
        }
    }

    afterRender() {
    }

    async deleteChapter(_target){
        let chapter = system.UI.reverseQuerySelector(_target, "space-chapter-unit");
        let chapterId = chapter.getAttribute("data-chapter-id");
        let flowId = system.space.getFlowIdByName("DeleteChapter");
        await system.services.callFlow(flowId, this._document.id, chapterId);
        this.invalidate();
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

    saveParagraph(paragraph, swapAction) {
        if (!swapAction) {
            system.space.currentParagraph = null;
        }
        paragraph["timer"].stop(true);
        paragraph["paragraph"].removeEventListener("keydown", this.resetTimer);
        paragraph["paragraph"].setAttribute("contenteditable", "false");
    }

    editParagraph(paragraph) {
        if (paragraph.getAttribute("contenteditable") === "false") {
            paragraph.setAttribute("contenteditable", "true");
            let paragraphUnit = system.UI.reverseQuerySelector(paragraph, ".paragraph-unit");
            paragraph.focus();
            this.previouslySelectedParagraph={};
            this.previouslySelectedParagraph["paragraph"] = paragraph;
            this.switchParagraphArrows(paragraphUnit, "on");
            let currentParagraphId = paragraphUnit.getAttribute("data-paragraph-id");
            system.space.currentParagraphId = currentParagraphId;
            let currentParagraph = this.chapter.getParagraph(currentParagraphId);

            let timer = system.services.SaveElementTimer(async () => {
                if (!currentParagraph) {
                    await timer.stop();
                    return;
                }
                let paragraphText = system.UI.sanitize(system.UI.customTrim(paragraph.innerText));
                if (paragraphText !== currentParagraph.text) {
                    let flowId = system.space.getFlowIdByName("UpdateParagraphText");
                    await system.services.callFlow(flowId, this._document.id, this.chapter.id, currentParagraph.id, paragraphText);
                }
            }, 1000);
            this.previouslySelectedParagraph["timer"]=timer;
            let flowId = system.space.getFlowIdByName("DeleteParagraph");
            this.resetTimer = async (event) => {
                if (paragraph.innerText.trim() === "" && event.key === "Backspace") {
                    if (currentParagraph) {
                        let curentParagraphIndex = this.chapter.getParagraphIndex(currentParagraphId);
                        await system.services.callFlow(flowId, this._document.id, this.chapter.id, currentParagraphId);
                        if (this.chapter.paragraphs.length > 0) {
                            if (curentParagraphIndex === 0) {
                                system.space.currentParagraphId = this.chapter.paragraphs[0].id;
                            } else {
                                system.space.currentParagraphId = this.chapter.paragraphs[curentParagraphIndex - 1].id;
                            }
                        } else {
                            system.space.currentParagraphId = null;
                        }
                        this.invalidate();
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
        this.chapterUnit = system.UI.getClosestParentElement(event.target, ".chapter-unit");
        this.paragraphUnit = system.UI.getClosestParentElement(event.target, ".paragraph-text");
        if (this.paragraphUnit) {
            /* clickul e pe un paragraf */
            if (this.chapterUnit.getAttribute("data-id") !== (this.previouslySelectedChapter?.getAttribute("data-id") || "")) {
                /* clickul e pe paragraf si un capitol diferit de cel curent */
                if (this.previouslySelectedParagraph) {
                    this.saveParagraph(this.previouslySelectedParagraph);
                }
                this.deselectPreviousParagraph();
                this.deselectPreviousChapter();
                await this.highlightChapter();
                this.editParagraph(this.paragraphUnit);
            } else {
                /* clickul e pe acelasi capitol dar alt paragraf*/
                if (this.paragraphUnit !== this.previouslySelectedParagraph["paragraph"]) {
                    /* clickul e pe un paragraf diferit de cel curent */
                    if (this.previouslySelectedParagraph) {
                        this.saveParagraph(this.previouslySelectedParagraph);
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
                this.deselectPreviousChapter();
                this.highlightChapter();
            } else {
                /* clickul e pe acelasi capitol dar nu pe un paragraf*/
                if (system.UI.getClosestParentElement(event.target, ".paragraph-arrows")) {
                    /* clickul e pe un buton de swap */
                    if (this.previouslySelectedParagraph) {
                        this.saveParagraph(this.previouslySelectedParagraph, "swap");
                    }
                    if (system.UI.getClosestParentElement(event.target, ".arrow-up") || system.UI.getClosestParentElement(event.target, ".arrow-up-space")) {
                        await this.moveParagraph(this.previouslySelectedParagraph["paragraph"], "up")
                    } else {
                        await this.moveParagraph(this.previouslySelectedParagraph["paragraph"], "down")
                    }
                } else {
                    if (system.UI.getClosestParentElement(event.target, ".chapter-arrows") && !event.target.classList.includes("delete-chapter")) {
                        /* clickul e pe un buton de swap al capitolului */
                        if(this.previouslySelectedParagraph){
                            this.saveParagraph(this.previouslySelectedParagraph);
                        }
                        if (system.UI.getClosestParentElement(event.target, ".arrow-up")) {
                            await this.moveChapter(event.target, "up");
                        }else{
                            await this.moveChapter(event.target, "down");
                        }
                        } else {
                        this.deselectPreviousParagraph();
                    }
                }
            }
        } else {
            /* clickul e in afara unui capitol si in afara unui paragraf*/
            if(this.previouslySelectedParagraph){
                this.saveParagraph(this.previouslySelectedParagraph);
            }
            this.deselectPreviousParagraph();
            this.deselectPreviousChapter();
            let leftSideBarItem = system.UI.getClosestParentElement(event.target, ".feature");
             if (leftSideBarItem) {
                controller.abort();
            }
        }
    }

    highlightChapter() {
        this.previouslySelectedChapter = this.chapterUnit;
        this.chapterUnit.setAttribute("id", "highlighted-chapter");
        this.switchArrowsDisplay(this.chapterUnit, "chapter", "on");
        let xMark = this.chapterUnit.querySelector(".delete-chapter");
        xMark.style.visibility = "visible";
        system.space.currentChapterId = this.chapterUnit.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(system.space.currentChapterId);
    }

    deselectPreviousParagraph() {
        if (this.previouslySelectedParagraph) {
            system.space.currentParagraphId = null;
            this.previouslySelectedParagraph["paragraph"].setAttribute("contenteditable", "false");
            this.switchParagraphArrows(this.previouslySelectedParagraph["paragraph"], "off");
            delete this.previouslySelectedParagraph;
        }
    }

    deselectPreviousChapter() {
        if (this.previouslySelectedChapter) {
            let xMark = this.previouslySelectedChapter.querySelector(".delete-chapter");
            xMark.style.visibility = "hidden";
            this.switchArrowsDisplay(this.previouslySelectedChapter, "chapter", "off");
            this.previouslySelectedChapter.removeAttribute("id");
            system.space.currentChapterId = null;
            delete this.previouslySelectedChapter;
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
        const currentChapter = system.UI.reverseQuerySelector(_target, "space-chapter-unit");
        const currentChapterId = currentChapter.getAttribute('data-chapter-id');
        const currentChapterIndex = this._document.getChapterIndex(currentChapterId);

        const getAdjacentChapterId = (index, chapters) => {
            if (direction === "up") {
                return index === 0 ? chapters[chapters.length - 1].id : chapters[index - 1].id;
            }
            return index === chapters.length - 1 ? chapters[0].id : chapters[index + 1].id;
        };

        const adjacentChapterId = getAdjacentChapterId(currentChapterIndex, this._document.chapters);

        let flowId = system.space.getFlowIdByName("SwapChapters");
        await system.services.callFlow(flowId, this._document.id, currentChapterId, adjacentChapterId);
        this.invalidate();
    }

    async moveParagraph(_target, direction) {
        let chapter = this._document.getChapter(system.space.currentChapterId);
        const currentParagraph = system.UI.reverseQuerySelector(_target, "space-paragraph-unit");
        const currentParagraphId = currentParagraph.getAttribute('data-paragraph-id');
        const currentParagraphIndex = chapter.getParagraphIndex(currentParagraphId);

        const getAdjacentParagraphId = (index, paragraphs) => {
            if (direction === "up") {
                return index === 0 ? paragraphs[paragraphs.length - 1].id : paragraphs[index - 1].id;
            }
            return index === paragraphs.length - 1 ? paragraphs[0].id : paragraphs[index + 1].id;
        };
        const adjacentParagraphId = getAdjacentParagraphId(currentParagraphIndex, chapter.paragraphs);
        const chapterId = system.UI.reverseQuerySelector(_target, "space-chapter-unit").getAttribute('data-chapter-id');
        if (chapter.swapParagraphs(currentParagraphId, adjacentParagraphId)) {
            await system.factories.updateDocument(system.space.id, this._document);
            system.space.currentParagraphId = currentParagraphId;
            system.UI.refreshElement(system.UI.getClosestParentWithPresenter(_target, "space-chapter-unit"));
        } else {
            console.error(`Unable to swap paragraphs. ${currentParagraphId}, ${adjacentParagraphId}, Chapter: ${chapterId}`);
        }
    }

    editTitle(title) {
        const titleEnterHandler = async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        };
        if (title.getAttribute("contenteditable") === "false") {
            title.setAttribute("contenteditable", "true");
            title.addEventListener('keydown', titleEnterHandler);
            title.focus();
            title.parentElement.setAttribute("id", "highlighted-chapter");
            let flowId = system.space.getFlowIdByName("UpdateDocumentTitle");
            let timer = system.services.SaveElementTimer(async () => {
                let titleText = system.UI.sanitize(system.UI.customTrim(title.innerText));
                if (titleText !== this._document.title && titleText !== "") {
                    await system.services.callFlow(flowId, this._document.id, titleText);
                }
            }, 1000);
            title.addEventListener("blur", async () => {
                title.innerText = system.UI.customTrim(title.innerText) || system.UI.unsanitize(this._document.title);
                await timer.stop(true);
                title.setAttribute("contenteditable", "false");
                title.removeEventListener('keydown', titleEnterHandler);
                title.removeEventListener("keydown", resetTimer);
                title.parentElement.removeAttribute("id");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            title.addEventListener("keydown", resetTimer);
        }
    }

    async editAbstract(abstract) {
        if (abstract.getAttribute("contenteditable") === "false") {
            let abstractSection = system.UI.reverseQuerySelector(abstract, ".abstract-section");
            abstract.setAttribute("contenteditable", "true");
            abstract.focus();
            abstractSection.setAttribute("id", "highlighted-chapter");
            let flowId = system.space.getFlowIdByName("UpdateAbstract");
            let timer =  system.services.SaveElementTimer(async () => {
                let abstractText = system.UI.sanitize(system.UI.customTrim(abstract.innerText));
                if (abstractText !== this._document.abstract && abstractText !== "") {
                    await system.services.callFlow(flowId, this._document.id, abstractText);
                }
            }, 1000);

            abstract.addEventListener("blur", async () => {
                abstract.innerText = system.UI.customTrim(abstract.innerText) || system.UI.unsanitize(this._document.abstract);
                abstract.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                abstract.setAttribute("contenteditable", "false");
                abstractSection.removeAttribute("id");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            abstract.addEventListener("keydown", resetTimer);
        }
    }

    async addChapter() {
        let flowId = system.space.getFlowIdByName("AddChapter");
        await system.services.callFlow(flowId, this._document.id, "");
        this.invalidate();
    }

    async addParagraph(_target) {
        let flowId = system.space.getFlowIdByName("AddParagraph");
        await system.services.callFlow(flowId, this._document.id, system.space.currentChapterId);
        this._document.notifyObservers(this._document.getNotificationId() + ":document-view-page:" + "chapter:" + `${system.space.currentChapterId}`);
    }
    async openDocumentsPage() {
        await system.UI.changeToDynamicPage("space-configs-page", `${system.space.id}/SpaceConfiguration/space-documents-page`);
    }
}