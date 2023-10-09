import {
    closeModal,
    showActionBox,
    showModal,
} from "../../../imports.js";
import { reverseQuerySelector } from "../../../../WebSkel/utils/dom-utils.js";
import { removeActionBox } from "../../../../WebSkel/utils/modal-utils.js";

export class editAbstractPage {
    constructor(element, invalidate) {
        this.element=element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._document.observeChange(this._document.getNotificationId()+ ":edit-abstract-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();

    }

    beforeRender() {
        this.title = `<title-view title="${this._document.getTitle()}"></title-view>`;
        this.abstractText=this._document.abstract;
        this.alternativeAbstracts = "";
        let i = 1;
        this._document.alternativeAbstracts.forEach((abstract)=>{
            this.alternativeAbstracts += `<alternative-abstract data-nr="${i}" data-id="${abstract.id}" data-title="${abstract.content}"></alternative-abstract>`;
            i++;
        });
        document.removeEventListener("click", this.removeEventForDocument, true);
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

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async saveAbstract() {
        let updatedAbstract = this.element.querySelector(".abstract-content").innerText;
        await this._document.updateAbstract(updatedAbstract);
    }

    afterRender() {
        this.editableAbstract = this.element.querySelector("#editable-abstract");
        this.editableAbstract.addEventListener("dblclick", this.setEditableAbstract);
        document.addEventListener("click", this.removeEventForDocument.bind(this), true);
    }


    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async generateAbstract(_target){
        await showModal(document.querySelector("body"), "suggest-abstract-modal", { presenter: "suggest-abstract-modal"});
    }

    async select(_target) {
        let abstract = reverseQuerySelector(_target,".content").innerText;
        if(abstract !== this._document.abstract) {
            await this._document.updateAbstract(abstract);
            await documentFactory.updateDocument(currentSpaceId, this._document);
            this._document.notifyObservers(this._document.getNotificationId());
        } else {
            removeActionBox(this.actionBox, this);
        }
    }

    async edit(_target) {
        let abstractText = reverseQuerySelector(_target, ".content");
        let alternativeAbstractId = reverseQuerySelector(_target, "alternative-abstract").getAttribute("data-id");
        let abstract = this._document.getAlternativeAbstract(alternativeAbstractId);
        removeActionBox(this.actionBox, this);
        abstractText.contentEditable = true;
        abstractText.focus();
        abstractText.addEventListener('blur', async () => {
            abstractText.contentEditable = false;
            if(abstractText.innerText !== abstract.content) {
                this._document.updateAlternativeAbstract(alternativeAbstractId, abstractText.innerText)
                await documentFactory.updateDocument(currentSpaceId, this._document);
            }
        });
    }

    async delete(_target) {
        let abstract = reverseQuerySelector(_target, "alternative-abstract");
        this._document.deleteAlternativeAbstract(abstract.getAttribute("data-id"));
        await documentFactory.updateDocument(currentSpaceId, this._document);
        this.invalidate();
    }

    removeEventForDocument(event) {
        if(this.editableAbstract.getAttribute("contenteditable") === "true" && !this.editableAbstract.contains(event.target)) {
            this.editableAbstract.setAttribute("contenteditable", "false");
            this.editableAbstract.removeEventListener("click", this.setEditableAbstract);
        }

    }

    setEditableAbstract(event) {
        this.setAttribute("contenteditable", "true");
        this.focus();
        event.stopPropagation();
        event.preventDefault();
    }
}

