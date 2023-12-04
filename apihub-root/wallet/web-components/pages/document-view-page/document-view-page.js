import {
    getClosestParentElement,
    parseURL,
    reverseQuerySelector,
    SaveElementTimer,
    sanitize,
    unsanitize,
    customTrim,
    getClosestParentWithPresenter,
    refreshElement,
    showModal
} from "../../../imports.js";

export class documentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.currentUser.space.getDocument(parseURL());
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
                this.chaptersContainer += `<chapter-unit data-chapter-number="${iterator}" data-chapter-id="${item.id}" data-presenter="chapter-unit"></chapter-unit>`;
            });
        }
    }

    afterRender() {
        this.chapterSidebar = this.element.querySelector("#chapter-sidebar");
        this.paragraphSidebar = this.element.querySelector("#paragraph-sidebar");
    }

    highlightElement(controller, event) {
        this.chapterUnit = getClosestParentElement(event.target, ".chapter-unit");
        /* clickul e pe un capitol */
        if (this.chapterUnit) {
            /* clickul e pe un capitol diferit de cel curent */
            if (this.chapterUnit!==this.previouslySelectedChapter) {
                /* scoate highlight-ul vizual de pe paragraf si capitol */
                this.deselectPreviousParagraph();
                this.deselectPreviousChapter();
                this.highlightChapter();
            }
        } else {
            /* clickul e in afara unui capitol(pe document/sidebars) */
            this.deselectPreviousParagraph();
            this.deselectPreviousChapter();
            let rightSideBarItem = getClosestParentElement(event.target, ".sidebar-item");
            let leftSideBarItem = getClosestParentElement(event.target, ".feature");
            /* data-keep-page inseamna ca nu schimbam pagina ci doar dam refresh(#Add chapter) -> */
            if (rightSideBarItem) {
                if (!rightSideBarItem.getAttribute("data-keep-page")) {
                    controller.abort();
                }
            } else if (leftSideBarItem) {
                controller.abort();
            } else {
                this.displaySidebar("document-sidebar","on");
            }
        }
    }

    highlightChapter() {
        this.displaySidebar("chapter-sidebar","on");
        this.previouslySelectedChapter = this.chapterUnit;
        this.chapterUnit.setAttribute("id", "highlighted-chapter");
        this.switchArrowsDisplay(this.chapterUnit, "chapter", "on");
        webSkel.currentUser.space.currentChapterId = this.chapterUnit.getAttribute("data-chapter-id");
    }

    deselectPreviousParagraph() {
        if (this.previouslySelectedParagraph) {
            webSkel.currentUser.space.currentParagraphId = null;
            this.switchArrowsDisplay(this.previouslySelectedParagraph, "paragraph");
            delete this.previouslySelectedParagraph;
        }
    }

    deselectPreviousChapter() {
        if (this.previouslySelectedChapter) {
            this.switchArrowsDisplay(this.previouslySelectedChapter, "chapter");
            this.previouslySelectedChapter.removeAttribute("id");
            webSkel.currentUser.space.currentChapterId = null;
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

    displaySidebar(sidebarID,mode) {
            if (sidebarID === "paragraph-sidebar") {
                mode==="on"?this.paragraphSidebar.style.display = "block":this.paragraphSidebar.style.display = "none";
            } else if (sidebarID === "chapter-sidebar") {
                mode==="on"?this.chapterSidebar.style.display = "block":this.chapterSidebar.style.display = "none";
            } else {
                this.paragraphSidebar.style.display = "none";
                this.chapterSidebar.style.display = "none";
            }
    }

    async moveChapter(_target, direction) {
        const currentChapter = reverseQuerySelector(_target, "chapter-unit");
        const currentChapterId = currentChapter.getAttribute('data-chapter-id');
        const currentChapterIndex = this._document.getChapterIndex(currentChapterId);

        const getAdjacentChapterId = (index, chapters) => {
            if (direction === "up") {
                return index === 0 ? chapters[chapters.length - 1].id : chapters[index - 1].id;
            }
            return index === chapters.length - 1 ? chapters[0].id : chapters[index + 1].id;
        };

        const adjacentChapterId = getAdjacentChapterId(currentChapterIndex, this._document.chapters);

        let flowId = webSkel.currentUser.space.getFlowIdByName("SwapChapters");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, currentChapterId, adjacentChapterId);
        this.invalidate();
    }

    async moveParagraph(_target, direction) {
        let chapter = this._document.getChapter(webSkel.currentUser.space.currentChapterId);
        const currentParagraph = reverseQuerySelector(_target, "paragraph-unit");
        const currentParagraphId = currentParagraph.getAttribute('data-paragraph-id');
        const currentParagraphIndex = chapter.getParagraphIndex(currentParagraphId);

        const getAdjacentParagraphId = (index, paragraphs) => {
            if (direction === "up") {
                return index === 0 ? paragraphs[paragraphs.length - 1].id : paragraphs[index - 1].id;
            }
            return index === paragraphs.length - 1 ? paragraphs[0].id : paragraphs[index + 1].id;
        };
        const adjacentParagraphId = getAdjacentParagraphId(currentParagraphIndex, chapter.paragraphs);
        const chapterId = reverseQuerySelector(_target, "chapter-unit").getAttribute('data-chapter-id');
        if (chapter.swapParagraphs(currentParagraphId, adjacentParagraphId)) {
            await documentFactory.updateDocument(webSkel.currentUser.space.id, this._document);
            webSkel.currentUser.space.currentParagraphId = currentParagraphId;
            refreshElement(getClosestParentWithPresenter(_target, "chapter-unit"));
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
            let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateDocumentTitle");
            let timer = new SaveElementTimer(async () => {
                let titleText = sanitize(customTrim(title.innerText));
                if (titleText !== this._document.title && titleText !== "") {
                    await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, titleText);
                }
            }, 1000);
            title.addEventListener("blur", async () => {
                title.innerText = customTrim(title.innerText) || unsanitize(this._document.title);
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
            let abstractSection = reverseQuerySelector(abstract, ".abstract-section");
            abstract.setAttribute("contenteditable", "true");
            abstract.focus();
            abstractSection.setAttribute("id", "highlighted-chapter");
            let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateAbstract");
            let timer = new SaveElementTimer(async () => {
                let abstractText = sanitize(customTrim(abstract.innerText));
                if (abstractText !== this._document.abstract && abstractText !== "") {
                    await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, abstractText);
                }
            }, 1000);

            abstract.addEventListener("blur", async () => {
                abstract.innerText = customTrim(abstract.innerText) || unsanitize(this._document.abstract);
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
        let flowId = webSkel.currentUser.space.getFlowIdByName("AddChapter");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, "");
        this.invalidate();
    }

    async addParagraph(_target) {
        let flowId = webSkel.currentUser.space.getFlowIdByName("AddParagraph");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, webSkel.currentUser.space.currentChapterId);
        this._document.notifyObservers(this._document.getNotificationId() + ":document-view-page:" + "chapter:" + `${webSkel.currentUser.space.currentChapterId}`);
    }

    async openEditTitlePage() {
        await webSkel.changeToDynamicPage("edit-title-page", `documents/${this._document.id}/edit-title-page`);
    }

    async openEditAbstractPage() {
        await webSkel.changeToDynamicPage("edit-abstract-page", `documents/${this._document.id}/edit-abstract-page`);
    }

    async openDocumentSettingsPage() {
        await webSkel.changeToDynamicPage("document-settings-page", `documents/${this._document.id}/document-settings-page`);
    }

    async openManageChaptersPage() {
        await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this._document.id}/manage-chapters-page`);
    }

    async openChapterBrainstormingPage() {
        await webSkel.changeToDynamicPage("chapter-brainstorming-page",
            `documents/${this._document.id}/chapter-brainstorming-page/${webSkel.currentUser.space.currentChapterId}`);

    }

    async openManageParagraphsPage() {
        await webSkel.changeToDynamicPage("manage-paragraphs-page",
            `documents/${this._document.id}/manage-paragraphs-page/${webSkel.currentUser.space.currentChapterId}`);
    }

    async openParagraphProofreadPage() {
        await webSkel.changeToDynamicPage("paragraph-proofread-page", `documents/${this._document.id}/paragraph-proofread-page/${webSkel.currentUser.space.currentChapterId}/${webSkel.currentUser.space.currentParagraphId}`);
    }

    async openParagraphBrainstormingPage() {
        await webSkel.changeToDynamicPage("paragraph-brainstorming-page",
            `documents/${this._document.id}/paragraph-brainstorming-page/${webSkel.currentUser.space.currentChapterId}/${webSkel.currentUser.space.currentParagraphId}`);
    }

    async openEditChapterTitlePage() {
        await webSkel.changeToDynamicPage("chapter-title-page",
            `documents/${this._document.id}/chapter-title-page/${webSkel.currentUser.space.currentChapterId}`);
    }

    async openDocumentViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async openChapterEditor() {
        await webSkel.changeToDynamicPage("chapter-editor-page", `documents/${this._document.id}/chapter-editor-page/${webSkel.currentUser.space.currentChapterId}`);
    }
}