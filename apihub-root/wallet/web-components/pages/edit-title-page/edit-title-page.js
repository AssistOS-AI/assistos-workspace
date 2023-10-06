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
        this._document.alternativeTitles.forEach((alternativeTitle) => {
            this.alternativeTitles += `<alternative-title data-nr="${i}" data-title="${alternativeTitle.name}" data-id="${alternativeTitle.id}"></alternative-title>`;
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
            this.invalidate();
        }
        else {
            removeActionBox(this.actionBox, this);
        }
    }

    async edit(_target) {
        let newTitle = reverseQuerySelector(_target, ".suggested-title");

        let component = reverseQuerySelector(_target, "alternative-title")
        let altTitleObj = this._document.getAlternativeTitle(component.getAttribute("data-id"));
        removeActionBox(this.actionBox, this);
        newTitle.contentEditable = true;
        newTitle.focus();

        newTitle.addEventListener('blur', async () => {
            newTitle.contentEditable = false;

            if(newTitle.innerText !== altTitleObj.name) {
                this._document.updateAlternativeTitle(altTitleObj.id, newTitle.innerText);
                await documentFactory.updateDocument(currentSpaceId, this._document);
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
}