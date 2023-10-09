import { getClosestParentElement} from "../../../../imports.js";

export class chapterUnit {
    constructor(element,invalidate) {
        this.element = element;
        this._document=webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page", invalidate);
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(this.chapterId);
        this.chapterContent = "";
        if(this.chapter.visibility === "hide") {
            if(this.element.querySelector(".chapter-paragraphs")) {
                this.element.querySelector(".chapter-paragraphs").classList.add("hidden");
            }
        }

        this.chapter.paragraphs.forEach((paragraph) => {
            this.chapterContent += `<paragraph-unit data-paragraph-content="${paragraph.text}" data-paragraph-id="${paragraph.id}"></paragraph-unit>`;
        });

        document.removeEventListener("click", this.exitEditMode);
    }

    showOrHideChapter(_target) {
        if (this.chapter.visibility === "hide") {
            this.chapter.visibility = "show";
        } else {
            this.chapter.visibility = "hide";
        }
        let paragraphs = this.element.querySelector(".chapter-paragraphs");
        paragraphs.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }

    async moveUp(_target) {
        let currentChapter = getClosestParentElement(_target, "chapter-unit");
        let chapterAbove = currentChapter.previousSibling;
        if(chapterAbove.nodeName === "CHAPTER-UNIT") {
            currentChapter.after(chapterAbove);
            let currentChapterNumber = currentChapter.querySelector(".data-chapter-number").innerText.split(".")[0];
            let chapterAboveNumber = chapterAbove.querySelector(".data-chapter-number").innerText.split(".")[0];

            let chapter1Index = this._document.chapters.findIndex(chapter => chapter.id === currentChapter.getAttribute('data-chapter-id'));
            let chapter2Index = this._document.chapters.findIndex(chapter => chapter.id === chapterAbove.getAttribute('data-chapter-id'));
            this._document.swapChapters(chapter1Index, chapter2Index);
            await documentFactory.updateDocument(currentSpaceId, this._document);

            currentChapter.setAttribute("data-chapter-number", chapterAboveNumber);
            currentChapter.querySelector(".data-chapter-number").innerText = chapterAboveNumber + ".";
            chapterAbove.setAttribute("data-chapter-number", currentChapterNumber);
            chapterAbove.querySelector(".data-chapter-number").innerText = currentChapterNumber + ".";
            let chapterAboveId = chapterAbove.getAttribute("data-chapter-id");
            let chapterAboveIndex = this._document.chapters.findIndex(chp => chp.id === chapterAboveId);
            if(this._document.chapters[chapterAboveIndex].visibility === "hide") {
                chapterAbove.querySelector(".chapter-paragraphs").classList.add("hidden");
                chapterAbove.querySelector(".arrow").classList.add("rotate");
            }
        }
    }

    async moveDown(_target) {
        let currentChapter = getClosestParentElement(_target, "chapter-unit");
        let chapterBelow = currentChapter.nextSibling;
        if(chapterBelow.nodeName === "CHAPTER-UNIT") {
            chapterBelow.after(currentChapter);
            let chapter1Index = this._document.chapters.findIndex(chapter => chapter.id === currentChapter.getAttribute('data-chapter-id'));
            let chapter2Index = this._document.chapters.findIndex(chapter => chapter.id === chapterBelow.getAttribute('data-chapter-id'));
            this._document.swapChapters(chapter1Index, chapter2Index);
            await documentFactory.updateDocument(currentSpaceId, this._document);

            let currentChapterNumber = currentChapter.querySelector(".data-chapter-number").innerText.split(".")[0];
            let chapterBelowNumber = chapterBelow.querySelector(".data-chapter-number").innerText.split(".")[0];

            chapterBelow.setAttribute("data-chapter-number", currentChapterNumber);
            chapterBelow.querySelector(".data-chapter-number").innerText = currentChapterNumber + ".";
            currentChapter.setAttribute("data-chapter-number", chapterBelowNumber);
            currentChapter.querySelector(".data-chapter-number").innerText = chapterBelowNumber + ".";

            if (this.chapter.visibility === "hide") {
                this.element.querySelector(".chapter-paragraphs").classList.add("hidden");
                this.element.querySelector(".arrow").classList.add("rotate");
            }
        }
    }

    async moveParagraphUp(_target) {
        let currentParagraph = getClosestParentElement(_target, "paragraph-unit");
        let paragraphAbove = currentParagraph.previousSibling;
        let chapter = getClosestParentElement(currentParagraph, "chapter-unit");
        let chapterId = chapter.getAttribute('data-chapter-id');
        let chapterIndex = this._document.chapters.findIndex(chapter => chapter.id === chapterId);
        if(paragraphAbove && paragraphAbove.nodeName === "PARAGRAPH-UNIT") {
            currentParagraph.after(paragraphAbove);
            let paragraph1Index = this._document.chapters.findIndex(paragraph => paragraph.id === currentParagraph.getAttribute('data-paragraph-id'));
            let paragraph2Index = this._document.chapters.findIndex(paragraph => paragraph.id === paragraphAbove.getAttribute('data-paragraph-id'));

            this._document.swapParagraphs(chapterIndex, paragraph1Index, paragraph2Index);
            await documentFactory.updateDocument(currentSpaceId, this._document);
        }
    }

    async moveParagraphDown(_target) {
        let currentParagraph = getClosestParentElement(_target, "paragraph-unit");
        let paragraphBelow = currentParagraph.nextSibling;
        let chapter = getClosestParentElement(currentParagraph, "chapter-unit");
        let chapterId = chapter.getAttribute('data-chapter-id');
        let chapterIndex = this._document.chapters.findIndex(chapter => chapter.id === chapterId);
        if(paragraphBelow && paragraphBelow.nodeName === "PARAGRAPH-UNIT") {
            paragraphBelow.after(currentParagraph);
            let paragraph1Index = this._document.chapters.findIndex(paragraph => paragraph.id === currentParagraph.getAttribute('data-paragraph-id'));
            let paragraph2Index = this._document.chapters.findIndex(paragraph => paragraph.id === paragraphBelow.getAttribute('data-paragraph-id'));
            this._document.swapParagraphs(chapterIndex, paragraph1Index, paragraph2Index);
            await documentFactory.updateDocument(currentSpaceId, this._document);
        }
    }

    openChapterSidebar(_target) {
        let target = getClosestParentElement(_target, ".chapter-unit");
        let chapterId = target.getAttribute('data-chapter-id');
        const chapterSubmenuSection = document.getElementById("chapter-sidebar");
        chapterSubmenuSection.style.display = "block";
        target.setAttribute("id", "select-chapter-visualise");
        webSkel.space.currentChapterId = chapterId;
    }

    afterRender() {
        let selectedParagraphs = this.element.querySelectorAll(".paragraph-text");
        selectedParagraphs.forEach(paragraph => {
            paragraph.addEventListener("dblclick", this.enterEditMode.bind(this, paragraph), true);
        });
    }
    async exitEditMode ([chapterId, paragraphId], event) {
        if (this && this.getAttribute("contenteditable") === "true" && !this.contains(event.target)) {
            this.setAttribute("contenteditable", "false");
            let updatedText = this.innerText;
            if(updatedText === '\n') {
                updatedText = '';
            }

            let documentId = window.location.hash.split("/")[1];
            let doc = webSkel.space.getDocument(documentId);

            let sidebar = document.getElementById("paragraph-sidebar");
            sidebar.style.display = "none";
            if (updatedText !== doc.getParagraph(chapterId,paragraphId).text) {
                if (updatedText === null || updatedText.trim() === '') {
                    doc.removeParagraph(chapterId, paragraphId);
                    if (doc.getChapterParagraphs(chapterId).length === 0) {
                        doc.removeChapter(chapterId);
                    }
                } else {
                    doc.updateParagraphText(chapterId, paragraphId, updatedText);
                }
                await documentFactory.updateDocument(currentSpaceId, doc);
                doc.notifyObservers(doc.getNotificationId());
            }
        }
    }

    enterEditMode(paragraph, event) {
        paragraph.setAttribute("id", "selected-chapter");
        paragraph.setAttribute("contenteditable", "true");
        paragraph.focus();
        event.stopPropagation();
        event.preventDefault();

        let chapterId = getClosestParentElement(paragraph, ".chapter-unit").getAttribute("data-chapter-id");
        let paragraphId = getClosestParentElement(paragraph, ".paragraph-unit").getAttribute("data-paragraph-id");
        document.addEventListener("click", this.exitEditMode.bind(paragraph, [chapterId, paragraphId]), true);

        const paragraphSubmenuSection = document.getElementById("paragraph-sidebar");
        paragraphSubmenuSection.style.display = "block";
        webSkel.space.currentChapterId = chapterId;
        webSkel.space.currentParagraphId = paragraphId;
    }
}



