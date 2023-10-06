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
        this.abstractText=this._document.getAbstract();
        this.alternativeAbstracts = "";
        let length = this._document.getAlternativeAbstracts().length;
        for (let i = 0; i < length; i++) {
            this.alternativeAbstracts += `<alternative-abstract data-id="${i + 1}" data-title="${this._document.alternativeAbstracts[i]}"></alternative-abstract>`;
        }
        if (this.editableAbstract) {
            this.editableAbstract.removeEventListener("click", setEditableAbstract);
            document.removeEventListener("click", removeEventForDocument, true);
        }
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
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`, {"document-id": this._document.id});
    }

    async saveAbstract() {
        let updatedAbstract = document.querySelector(".abstract-content").innerText;
        let documentIndex = webSkel.space.documents.findIndex(doc => doc.id === this._document.id);
        debugger;
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

            await this._document.updateAbstract(updatedAbstract);

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
        await showModal(document.querySelector("body"), "suggest-abstract-modal", { presenter: "suggest-abstract-modal"});
    }

    async select(_target) {
        let abstract = reverseQuerySelector(_target,".content").innerText;
        if(abstract !== this._document.getAbstract()) {
            await this._document.updateAbstract(abstract);
            await documentFactory.updateDocument(currentSpaceId, this._document);
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
                    await documentFactory.updateDocument(currentSpaceId, this._document);
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
            await documentFactory.updateDocument(currentSpaceId, this._document);
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

