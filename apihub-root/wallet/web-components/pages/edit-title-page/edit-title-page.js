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
        this.title = `<title-edit title="${this._document.title}"></title-edit>`;
        this.alternativeTitles = "";
        let i = 1;
        this._document.getAlternativeTitles().forEach((alternativeTitle) => {
            this.alternativeTitles += `<alternative-title nr="${i}" title="${alternativeTitle}"></alternative-title>`;
            i++;
        });

    }
    async saveTitle(_target) {
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            if (formInfo.data.title !== this._document.getTitle()) {
                await this._document.updateDocumentTitle(formInfo.data.title);
            }
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
            this._document.notifyObservers(this._document.getNotificationId() + "alternativeTitlesId");
        }
        else {
            removeActionBox(this.actionBox, this);
        }
    }

    async edit(_target) {
        let alternativeTitle = reverseQuerySelector(_target, ".suggested-title");
        let alternativeTitleIndex = this._document.getAlternativeTitles().findIndex(title => title === alternativeTitle.innerText);
        if(alternativeTitleIndex !== -1) {
            removeActionBox(this.actionBox, this);
            alternativeTitle.contentEditable = true;
            alternativeTitle.focus();
            alternativeTitle.addEventListener('blur', async () => {
                alternativeTitle.contentEditable = false;
                if(alternativeTitle.innerText !== this._document.alternativeTitles[alternativeTitleIndex]) {
                    this._document.setAlternativeTitle(alternativeTitleIndex, alternativeTitle.innerText);
                    await documentFactory.updateDocument(currentSpaceId, this._document);
                }
            });
        }
        else {
            await showApplicationError("Error editing title", `Error editing title for document: ${this._document.title}`, `Error editing title for document: ${this._document.title}`);
        }
    }

    async delete(_target) {
        let alternativeTitle = reverseQuerySelector(_target, ".suggested-title");
        let alternativeTitleIndex = this._document.getAlternativeTitles().findIndex(title => title === alternativeTitle.innerText);
        if(alternativeTitleIndex !== -1) {
            this._document.deleteAlternativeTitle(alternativeTitleIndex);
            await documentFactory.updateDocument(currentSpaceId, this._document);
        } else {
            await showApplicationError("Error deleting title", `Error deleting title for document: ${this._document.title}`, `Error deleting title for document: ${this._document.title}`);
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}