import {
    extractFormInformation,
    showModal,
    closeModal,
    showActionBox,
    reverseQuerySelector,
    sanitize, SaveElementTimer, removeActionBox, parseURL
} from "../../../imports.js";

export class chapterTitlePage {
    constructor(element, invalidate) {
        this.element = element;
        let documentId, chapterId;
        [documentId,chapterId] = parseURL();
        this._document = webSkel.currentUser.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this._document.observeChange(this._document.getNotificationId() + "chapter-title-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.title = this._chapter.title;
        this.chapterNr = this._document.getChapterIndex(this._chapter.id) + 1;
        this.alternativeTitles = "";
        if (this._chapter.alternativeTitles) {
            for (let i = 0; i < this._chapter.alternativeTitles.length; i++) {
                this.alternativeTitles += `<alternative-title data-nr="${i + 1}" data-title="${this._chapter.alternativeTitles[i].title}" 
                data-id="${this._chapter.alternativeTitles[i].id}"></alternative-title>`;
            }
        }
    }

    async saveTitle(_target) {
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            const documentIndex = webSkel.currentUser.space.documents.findIndex(doc => doc.id === this.docId);
            const chapterIndex = this._document.getChapterIndex(this.chapterId);
            if (documentIndex !== -1 && chapterIndex !== -1 && formInfo.data.title !== this._document.getChapterTitle(this.chapterId)) {
                let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateChapterTitle");
                await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, formInfo.data.title);
            }
        }
    }

    async editTitle(button) {
        let title = this.element.querySelector(".chapter-title");
        if (title.getAttribute("contenteditable") === "false") {
            title.setAttribute("contenteditable", "true");
            title.focus();
            let timer = new SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = sanitize(title.innerText);
                if (sanitizedText !== this._chapter.title && !confirmationPopup) {
                    let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateChapterTitle");
                    await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, sanitizedText);
                    title.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${title.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            title.addEventListener("blur", async () => {
                title.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                title.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            title.addEventListener("keydown", resetTimer);
        }
    }
    async openChapterTitlePage() {
        await webSkel.changeToDynamicPage("chapter-title-page",
            `documents/${this.docId}/chapter-title-page/${this._chapter.id}`);

    }
    async edit(_target) {
        let component = reverseQuerySelector(_target, "alternative-title");
        let newTitle = component.querySelector(".suggested-title");

        if(this.actionBox){
            removeActionBox(this.actionBox, this);
        }
        if (newTitle.getAttribute("contenteditable") === "false") {

            let altTitleObj = this._chapter.getAlternativeTitle(component.getAttribute("data-id"));
            newTitle.setAttribute("contenteditable", "true");
            newTitle.focus();
            let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateAlternativeChapterTitle");
            let timer = new SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = sanitize(newTitle.innerText);
                if (sanitizedText !== altTitleObj.title && !confirmationPopup) {
                    await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, altTitleObj.id, sanitizedText);
                    newTitle.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${newTitle.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            newTitle.addEventListener("blur", async () => {
                newTitle.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                newTitle.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            newTitle.addEventListener("keydown", resetTimer);
        }
    }
    async delete(_target) {
        let alternativeTitle = reverseQuerySelector(_target, "alternative-title");
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteAlternativeChapterTitle");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, alternativeTitle.getAttribute("data-id"));
        this.invalidate();
    }
    async select(_target){
        let suggestedTitle = reverseQuerySelector(_target, "alternative-title");
        let suggestedTitleId = suggestedTitle.getAttribute("data-id");
        let flowId = webSkel.currentUser.space.getFlowIdByName("SelectAlternativeChapterTitle");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, suggestedTitleId);
        this.invalidate();
    }
    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async showSuggestChapterTitlesModal() {
        await showModal(document.querySelector("body"), "suggest-chapter-titles-modal", { presenter: "suggest-chapter-titles-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}