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
            let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateChapterTitle");
            await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, title.innerText);
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
        let flowId = webSkel.currentUser.space.getFlowIdByName("SuggestChapter");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, JSON.stringify(this._chapter.mainIdeas));
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

    }
    async deleteAction(_target){
        let paragraph = reverseQuerySelector(_target, "reduced-paragraph-unit");
        let paragraphId = paragraph.getAttribute("data-id");
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteParagraph");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, paragraphId);
        this.invalidate();
    }
    async delete(_target){
        let alternativeChapter = reverseQuerySelector(_target, "alternative-chapter");
        let alternativeChapterId = alternativeChapter.getAttribute("data-id");
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteAlternativeChapter");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, alternativeChapterId);
        this.invalidate();
    }
    async select(_target){
        let alternativeChapter = reverseQuerySelector(_target, "alternative-chapter");
        let alternativeChapterId = alternativeChapter.getAttribute("data-id");
        let flowId = webSkel.currentUser.space.getFlowIdByName("SelectAlternativeChapter");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, alternativeChapterId);
        removeActionBox(this.actionBox, this);
        webSkel.currentUser.space.currentChapterId = alternativeChapterId;
        await webSkel.changeToDynamicPage("chapter-brainstorming-page", `documents/${this._document.id}/chapter-brainstorming-page/${alternativeChapterId}`);
    }
}