import {
    extractFormInformation,
    closeModal,
    showActionBox,
    showModal
} from "../../../imports.js";
import { reverseQuerySelector } from "../../../../WebSkel/utils/dom-utils.js";
import { removeActionBox } from "../../../../WebSkel/utils/modal-utils.js";

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
        document.removeEventListener("click", this.exitEditMode);
    }
    async enterEditMode(_target) {
        let title = reverseQuerySelector(_target, ".document-title");
        title.setAttribute("contenteditable", "true");
        title.focus();
        document.addEventListener("click", this.exitEditMode.bind(this, title), true);
    }

    async exitEditMode (title, event) {
        if (title.getAttribute("contenteditable") && !title.contains(event.target)) {
            title.setAttribute("contenteditable", "false");
            this._document.title = title.innerText;
            await documentFactory.updateDocument(currentSpaceId, this._document);
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

    async select(_target) {
        let selectedTitle = reverseQuerySelector(_target,".suggested-title").innerText;
        if(selectedTitle !== this._document.getTitle()) {
            this._document.setTitle(selectedTitle);
            await documentFactory.updateDocument(currentSpaceId, this._document);
            this.invalidate();
        }
        else {
            removeActionBox(this.actionBox, this);
        }
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
                await this._document.updateAlternativeTitle(altTitleObj.id, newTitle.innerText);
            }
        });
    }

    async delete(_target) {
        let alternativeTitle = reverseQuerySelector(_target, "alternative-title");
        this._document.deleteAlternativeTitle(alternativeTitle.getAttribute("data-id"));
        await documentFactory.updateDocument(currentSpaceId, this._document);
        this.invalidate();
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    async openEditTitlePage() {
        await webSkel.changeToDynamicPage("edit-title-page", `documents/${this._document.id}/edit-title-page`);
    }
}