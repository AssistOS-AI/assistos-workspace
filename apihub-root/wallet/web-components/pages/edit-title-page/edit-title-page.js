import {
    closeModal,
    showActionBox,
    showModal,
    reverseQuerySelector,
    removeActionBox, sanitize
} from "../../../imports.js";

export class editTitlePage {
    constructor(element, invalidate) {
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._document.observeChange(this._document.getNotificationId() + ":edit-title-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.title = this._document.title;
        this.alternativeTitles = "";
        let i = 1;
        this._document.alternativeTitles.forEach((alternativeTitle) => {
            this.alternativeTitles += `<alternative-title data-nr="${i}" data-title="${alternativeTitle.name}" 
            data-id="${alternativeTitle.id}" data-local-action="edit querySelect"></alternative-title>`;
            i++;
        });
    }
    async enterEditMode(_target) {
        let title = reverseQuerySelector(_target, ".document-title");
        title.setAttribute("contenteditable", "true");
        title.focus();
        const controller = new AbortController();
        document.addEventListener("click", this.exitEditMode.bind(this, title, controller),{signal:controller.signal});
    }

    async exitEditMode (title, controller, event) {
        if (title.getAttribute("contenteditable") === "true" && title !== event.target && !title.contains(event.target)) {
            title.setAttribute("contenteditable", "false");
            this._document.title = title.innerText;
            await documentFactory.updateDocument(currentSpaceId, this._document);
            title.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
            data-message="Saved!" data-left="${title.offsetWidth/2}"></confirmation-popup>`);
            controller.abort();
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

    async edit(_target, querySelect) {
        let newTitle;
        if(querySelect){
            newTitle = _target.querySelector(".suggested-title");
        }else {
            newTitle = reverseQuerySelector(_target, ".suggested-title");
        }

        let component = reverseQuerySelector(_target, "alternative-title")
        let altTitleObj = this._document.getAlternativeTitle(component.getAttribute("data-id"));
        if(this.actionBox){
            removeActionBox(this.actionBox, this);
        }
        newTitle.contentEditable = true;
        newTitle.focus();

        newTitle.addEventListener('blur', async () => {
            newTitle.contentEditable = false;

            if(newTitle.innerText !== altTitleObj.name) {
                await this._document.updateAlternativeTitle(altTitleObj.id, sanitize(newTitle.innerText));
            }
            newTitle.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                data-message="Saved!" data-left="${newTitle.offsetWidth/2}"></confirmation-popup>`);
        }, {once:true});
    }

    async delete(_target) {
        let alternativeTitle = reverseQuerySelector(_target, "alternative-title");
        this._document.deleteAlternativeTitle(alternativeTitle.getAttribute("data-id"));
        await documentFactory.updateDocument(currentSpaceId, this._document);
        this.invalidate();
    }
    async select(_target){
        let suggestedTitle = reverseQuerySelector(_target, "alternative-title");
        let suggestedTitleId = suggestedTitle.getAttribute("data-id");
        await this._document.selectAlternativeTitle(suggestedTitleId);
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