import {
    closeModal, DocumentModel,
    showActionBox,
    showModal, Space
} from "../../../imports.js";
import { reverseQuerySelector } from "../../../../WebSkel/utils/dom-utils.js";
import { removeActionBox } from "../../../../WebSkel/utils/modal-utils.js";

export class editAbstractPage {
    constructor(element, invalidate) {
        this.element = element;
        let url = window.location.hash;
        this.id = url.split('/')[1];
        this._document = webSkel.space.getDocument(this.id);
        this.abstractText = this._document.getAbstract();

        this._document.observeChange(this._document.getNotificationId()+ ":edit-abstract-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();

    }

    beforeRender() {
        this.title = `<title-view title="${this._document.getTitle()}"></title-view>`;
        this.alternativeAbstracts = "";
        for (let i = 0; i < this._document.getAlternativeAbstracts().length; i++) {
            this.alternativeAbstracts += `<alternative-abstract data-id="${i + 1}" data-title="${this._document.alternativeAbstracts[i]}"></alternative-abstract>`;
        }
        if (this.editableAbstract) {
            this.editableAbstract.removeEventListener("click", setEditableAbstract);
            document.removeEventListener("click", removeEventForDocument, true);
        }
    }

    async openEditTitlePage() {
        await webSkel.changeToDynamicPage("edit-title-page", `documents/${this.id}/edit-title-page`);
    }

    async openEditAbstractPage() {
        await webSkel.changeToDynamicPage("edit-abstract-page", `documents/${this.id}/edit-abstract-page`);
    }

    async openDocumentSettingsPage() {
        await webSkel.changeToDynamicPage("document-settings-page", `documents/${this.id}/document-settings-page`);
    }

    async openManageChaptersPage() {
        await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this.id}/manage-chapters-page`);
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this.id}/document-view-page`);
    }

    async saveAbstract() {
        let updatedAbstract = document.querySelector(".abstract-content").innerText;
        let documentIndex = webSkel.space.documents.findIndex(doc => doc.id === this.id);
        if (documentIndex !== -1 && updatedAbstract !== this._document.getAbstract()) {
            for (let i = 0; i < updatedAbstract.length; i++) {
                if (updatedAbstract[i] === '\n') {
                    let numberOfNewLines = 0;
                    let initialIndex = i;
                    while (updatedAbstract[i] === '\n') {
                        i++;
                        numberOfNewLines++;
                    }
                    numberOfNewLines = Math.floor(numberOfNewLines / 2) + 1;
                    let newLineString = "";
                    for (let j = 0; j < numberOfNewLines; j++) {
                        newLineString += "<br>";
                    }
                    updatedAbstract = updatedAbstract.slice(0, initialIndex) + newLineString + updatedAbstract.slice(i);
                }
            }
            this._document.updateAbstract(updatedAbstract);
            await documentFactory.addDocument(currentSpaceId, this._document);
        }
    }

    afterRender() {
        this.editableAbstract = this.element.querySelector("#editable-abstract");
        this.editableAbstract.addEventListener("dblclick", setEditableAbstract);
        document.addEventListener("click", removeEventForDocument, true);
        document.editableAbstract = this.editableAbstract;
    }


    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async generateAbstract(_target){
        const loading = await webSkel.showLoading();
        async function suggestAbstract() {
            const documentText = webSkel.space.getDocument(webSkel.space.currentDocumentId).toString();
            const defaultPrompt = `Given the content of the following document: "${documentText}". Please generate a concise and contextually appropriate abstract that accurately reflects the document's key points, themes, and findings. Your response should consist solely of the abstract text.`;
            const llmId = webSkel.space.settings.llms[0].id;
            return await webSkel.space.suggestAbstract(defaultPrompt, llmId);
        }
        this.suggestedAbstract = await suggestAbstract();
        this._document.observeChange(this._document.getNotificationId(), this.updateState);
        loading.close();
        loading.remove();
        await showModal(document.querySelector("body"), "suggest-abstract-modal", { presenter: "suggest-abstract-modal"});
    }

    async select(_target) {
        let abstract = reverseQuerySelector(_target,".content").innerText;
        if(abstract !== this._document.getAbstract()) {
            this._document.updateAbstract(abstract);
            await documentFactory.addDocument(currentSpaceId, this._document);
            this._document.notifyObservers(this._document.getNotificationId());
        } else {
            removeActionBox(this.actionBox, this);
        }
    }

    async edit(_target) {
        let abstract = reverseQuerySelector(_target, ".content");
        let alternativeAbstractIndex = this._document.alternativeAbstracts.findIndex(abs => abs.id === abstract.id);
        if(alternativeAbstractIndex !== -1) {
            removeActionBox(this.actionBox, this);
            abstract.contentEditable = true;
            abstract.focus();
            abstract.addEventListener('blur', async () => {
                abstract.contentEditable = false;
                if(abstract.innerText !== this._document.alternativeAbstracts[alternativeAbstractIndex]) {
                    this._document.alternativeAbstracts[alternativeAbstractIndex] = abstract.innerText;
                    await documentFactory.addDocument(currentSpaceId, this._document);
                }
            });
        }
        else {
            await showApplicationError("Error editing abstract", `Error editing abstract for document: ${this._document.title}`, `Error editing abstract for document: ${this._document.title}`);
        }
    }

    async delete(_target) {
        let abstract = reverseQuerySelector(_target, ".content");
        let alternativeAbstractIndex = this._document.alternativeAbstracts.findIndex(abs => abs.id === abstract.id);
        if(alternativeAbstractIndex !== -1) {
            this._document.alternativeAbstracts.splice(alternativeAbstractIndex, 1);
            await documentFactory.addDocument(currentSpaceId, this._document);
        } else {
            await showApplicationError("Error deleting abstract", `Error deleting abstract for document: ${this._document.title}`, `Error deleting abstract for document: ${this._document.title}`);
        }
    }
}

function removeEventForDocument(event) {
    if(this.editableAbstract.getAttribute("contenteditable") === "true" && !this.editableAbstract.contains(event.target)) {
        this.editableAbstract.setAttribute("contenteditable", "false");
    }
}

function setEditableAbstract(event) {
    this.setAttribute("contenteditable", "true");
    this.focus();
    event.stopPropagation();
    event.preventDefault();
}

