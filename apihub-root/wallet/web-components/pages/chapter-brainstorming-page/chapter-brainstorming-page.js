import {
    reverseQuerySelector,
    showActionBox,
    showModal,
    removeActionBox,
    Chapter, parseURL
} from "../../../imports.js";

export class chapterBrainstormingPage {
    constructor(element, invalidate) {
        this.element = element;
        let documentId, chapterId;
        [documentId,chapterId] = parseURL();
        this._document = webSkel.currentUser.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this._document.observeChange(this._document.getNotificationId() + ":chapter-brainstorming-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.chapterNr=this._document.getChapterIndex(this._chapter.id)+1;
        this.chapterTitle=this._chapter.title;
        this.chapterContent="";
        this.alternativeChapters = "";
        let alternativeChapterText = "";
        let number = 0;
        this._chapter.paragraphs.forEach((item) => {
            number++;
            this.chapterContent += `<reduced-paragraph-unit data-local-action="openParagraphBrainstormingPage" data-id="${item.id}" data-local-action="editAction"
            data-nr="${number}" data-text="${item.text}"></reduced-paragraph-unit>`;
        });
        this._chapter.alternativeChapters.forEach((item) => {
            alternativeChapterText = "";
            item.paragraphs.forEach((paragraph) => {
                alternativeChapterText+=paragraph.text;
            })
            this.alternativeChapters += `<alternative-chapter data-text="${alternativeChapterText}" data-id="${item.id}"></alternative-chapter>`;
        });
    }

    async enterEditMode(_target) {
        let title = reverseQuerySelector(_target, ".main-idea-title");
        title.setAttribute("contenteditable", "true");
        title.focus();
        const controller = new AbortController();
        document.addEventListener("click", this.exitEditMode.bind(this, title, controller), {signal:controller.signal});
    }
    async exitEditMode (title, controller, event) {
        if (title.getAttribute("contenteditable") === "true" && title !== event.target && !title.contains(event.target)) {
            title.setAttribute("contenteditable", "false");
            await this._document.updateChapterTitle(this._chapter, title.innerText)
            title.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
            data-message="Saved!" data-left="${title.offsetWidth/2}"></confirmation-popup>`);
            controller.abort();
        }
    }

    async suggestParagraph(){
        await showModal(document.querySelector("body"), "suggest-paragraph-modal", { presenter: "suggest-paragraph-modal"});
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }
    async suggestChapter(){
        let scriptId = webSkel.currentUser.space.getScriptIdByName("suggest chapter");
        let result = await webSkel.getService("LlmsService").callScript(scriptId, JSON.stringify(this._chapter.mainIdeas));
        let chapterObj=result.responseJson;
        chapterObj.id=webSkel.servicesRegistry.UtilsService.generateId();
        for(let paragraph of chapterObj.paragraphs){
            paragraph.id=webSkel.servicesRegistry.UtilsService.generateId();
        }

        this._chapter.alternativeChapters.push(new Chapter(chapterObj));
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this._document);
        this.invalidate();
    }
    async openCloneChapterModal(){
        await showModal(document.querySelector("body"), "clone-chapter-modal", { presenter: "clone-chapter-modal"});

    }
    async openChapterBrainStormingPage(){
        await webSkel.changeToDynamicPage("chapter-brainstorming-page", `documents/${this._document.id}/chapter-brainstorming-page/${this._chapter.id}`);
    }
    async openParagraphBrainstormingPage(_target) {
        let paragraphId = reverseQuerySelector(_target, "reduced-paragraph-unit").getAttribute("data-id");
        webSkel.currentUser.space.currentParagraphId = paragraphId;
        await webSkel.changeToDynamicPage("paragraph-brainstorming-page",
            `documents/${this._document.id}/paragraph-brainstorming-page/${webSkel.currentUser.space.currentChapterId}/${webSkel.currentUser.space.currentParagraphId}`);
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async editAction(_target, querySelect){
        let paragraph;
        if(querySelect){
            paragraph = _target.querySelector(".content");
        }else {
            paragraph = reverseQuerySelector(_target, ".content");
        }
        let paragraphComponent = reverseQuerySelector(_target, "alternative-paragraph");
        let paragraphId = paragraphComponent.getAttribute("data-id");
        let alternativeParagraph = this._paragraph.getAlternativeParagraph(paragraphId);
        if(this.actionBox){
            removeActionBox(this.actionBox, this);
        }
        paragraph.contentEditable = true;
        paragraph.focus();
        paragraph.addEventListener('blur', async () => {
            paragraph.contentEditable = false;
            if(paragraph.innerText !== alternativeParagraph.text) {
                await this._document.updateAlternativeParagraph(this._paragraph, paragraphId, paragraph.innerText)
            }
        }, {once:true});
    }
    async deleteAction(_target){
        let paragraph = reverseQuerySelector(_target, "reduced-paragraph-unit");
        let paragraphId = paragraph.getAttribute("data-id");
        await this._document.deleteParagraph(this._chapter, paragraphId);
        this.invalidate();
    }
    async delete(_target){
        let alternativeChapter = reverseQuerySelector(_target, "alternative-chapter");
        let alternativeChapterId = alternativeChapter.getAttribute("data-id");
        await this._document.deleteAlternativeChapter(this._chapter, alternativeChapterId);
        this.invalidate();
    }
    async select(_target){
        let alternativeChapter = reverseQuerySelector(_target, "alternative-chapter");
        let alternativeChapterId = alternativeChapter.getAttribute("data-id");
        await this._document.selectAlternativeChapter(this._chapter, alternativeChapterId);
        removeActionBox(this.actionBox, this);
        webSkel.currentUser.space.currentChapterId = alternativeChapterId;
        await webSkel.changeToDynamicPage("chapter-brainstorming-page", `documents/${this._document.id}/chapter-brainstorming-page/${alternativeChapterId}`);
    }
}