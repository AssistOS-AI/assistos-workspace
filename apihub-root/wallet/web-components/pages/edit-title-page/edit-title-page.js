import {
    closeModal,
    showActionBox,
    showModal,
    reverseQuerySelector,
    removeActionBox, sanitize, SaveElementTimer, getClosestParentElement, parseURL
} from "../../../imports.js";

export class editTitlePage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.currentUser.space.getDocument(parseURL());
        this._document.observeChange(this._document.getNotificationId() + ":edit-title-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.title = this._document.title;
        this.alternativeTitles = "";
        let i = 1;
        this._document.alternativeTitles.forEach((alternativeTitle) => {
            this.alternativeTitles += `<alternative-title data-nr="${i}" data-title="${sanitize(alternativeTitle.title)}" 
            data-id="${alternativeTitle.id}" ></alternative-title>`;
            i++;
        });
    }
    async editTitle(button) {
        let title = this.element.querySelector(".document-title");
        if (title.getAttribute("contenteditable") === "false") {
            title.setAttribute("contenteditable", "true");
            title.focus();
            let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateDocumentTitle");
            let timer = new SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = sanitize(title.innerText);
                if (sanitizedText !== this._document.title && !confirmationPopup) {
                    await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, sanitizedText);
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

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async showSuggestTitlesModal() {
        await showModal(document.querySelector("body"), "suggest-titles-modal", { presenter: "suggest-titles-modal"});
    }

    async edit(_target) {

        let component = reverseQuerySelector(_target, "alternative-title");
        let newTitle = component.querySelector(".suggested-title");

        if(this.actionBox){
            removeActionBox(this.actionBox, this);
        }
        if (newTitle.getAttribute("contenteditable") === "false") {

            let altTitleObj = this._document.getAlternativeTitle(component.getAttribute("data-id"));
            newTitle.setAttribute("contenteditable", "true");
            newTitle.focus();
            let timer = new SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = sanitize(newTitle.innerText);
                if (sanitizedText !== altTitleObj.title && !confirmationPopup) {
                    let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateAlternativeDocumentTitle");
                    await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, altTitleObj.id, sanitizedText);
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
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteAlternativeDocumentTitle");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, alternativeTitle.getAttribute("data-id"));
        this.invalidate();
    }
    async select(_target){
        let suggestedTitle = reverseQuerySelector(_target, "alternative-title");
        let suggestedTitleId = suggestedTitle.getAttribute("data-id");
        let flowId = webSkel.currentUser.space.getFlowIdByName("SelectAlternativeDocumentTitle");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, suggestedTitleId);
        removeActionBox(this.actionBox, this);
        this.invalidate();
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    async openEditTitlePage() {
        await webSkel.changeToDynamicPage("edit-title-page", `documents/${this._document.id}/edit-title-page`);
    }
}