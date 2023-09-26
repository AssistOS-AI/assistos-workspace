import {
    extractFormInformation,
    closeModal,
    showActionBox,
    showModal, DocumentModel, LLM, Space
} from "../../../imports.js";
import { reverseQuerySelector } from "../../../../WebSkel/utils/dom-utils.js";
import { removeActionBox } from "../../../../WebSkel/utils/modal-utils.js";

export class editTitlePage {
    constructor() {
        this.docTitle = "Current Title";
        let url = window.location.hash;
        this.id = parseInt(url.split('/')[1]);
        this._document = webSkel.space.getDocument(this.id);
        if(this._document) {
            setTimeout(() => {
                this.invalidate();
            }, 0);
            this.docTitle = this._document.getTitle();
            this.chapters = this._document.getAllChapters();
        } else {
            console.log(`this _document doesnt exist: docId: ${this.id}`);
        }

        this.updateState = () => {
            this._document =  webSkel.space.getDocument(this.id);
            this.docTitle = this._document.getTitle();
            this.invalidate();
        }
        this._document.observeChange(this._document.getNotifyId() + ":edit-title-page", this.updateState);
    }

    beforeRender() {
        this.title = `<title-edit title="${this.docTitle}"></title-edit>`;
        this.alternativeTitles = "";
        if(this._document) {
            let i = 1;
            this._document.getAlternativeTitles().forEach((alternativeTitle) => {
                this.alternativeTitles += `<alternative-title nr="${i}" title="${alternativeTitle}"></alternative-title>`;
                i++;
            });
        }
    }

    async saveTitle(_target) {
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            if (formInfo.data.title !== this._document.getTitle()) {
                this._document.updateDocumentTitle(formInfo.data.title);
                await storageManager.storeObject(currentSpaceId, "documents", this._document.id, this._document.stringifyDocument());
            }
        }
    }

    async openEditTitlePage() {
        await webSkel.changeToStaticPage(`documents/${this.id}/edit-title`);
    }

    async openEditAbstractPage() {
        await webSkel.changeToStaticPage(`documents/${this.id}/edit-abstract`);
    }

    async openDocumentSettingsPage() {
        await webSkel.changeToStaticPage(`documents/${this.id}/settings`);
    }

    async openBrainstormingPage() {
        await webSkel.changeToStaticPage(`documents/${this.id}/brainstorming`);
    }

    async openViewPage() {
        await webSkel.changeToStaticPage(`documents/${this.id}`);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async showSuggestTitlesModal() {
        const loading = await webSkel.showLoading();
        const documentText = webSkel.space.getDocument(this.id).toString();
        async function generateSuggestTitles(){
            const defaultPrompt = `Based on the following document:\n"${documentText}"\n\nPlease suggest 10 original titles that are NOT already present as chapter titles in the document. Return the titles as a JSON array.`;
            if(webSkel.space.settings.llms.length <= 0) {
                loading.close();
                loading.remove();
                await showApplicationError("Space has no LLMs", "Space has no LLMS", "Space has no LLMS");
                return;
            }
            const llmId = webSkel.space.settings.llms[0].id;
            return await webSkel.space.suggestTitles(defaultPrompt, llmId);
        }
        while(!this.suggestedTitles) {
            try {
                this.suggestedTitles = JSON.parse(await generateSuggestTitles()).titles;
            } catch (e) {
                console.error(e);
            }
        }
        loading.close();
        loading.remove();
        await showModal(document.querySelector("body"), "suggest-titles-modal", { presenter: "suggest-titles-modal"});
    }

    async select(_target) {
        let selectedTitle = reverseQuerySelector(_target,".suggested-title").innerText;
        if(selectedTitle !== this._document.getTitle()) {
            this._document.setTitle(selectedTitle);
            await storageManager.storeObject(currentSpaceId, "documents", this._document.id, this._document.stringifyDocument());

            this._document.notifyObservers(this._document.getNotifyId() + "alternativeTitlesId");
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
                    await storageManager.storeObject(currentSpaceId, "documents", this._document.id, this._document.stringifyDocument());
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
            await storageManager.storeObject(currentSpaceId, "documents", this._document.id, this._document.stringifyDocument());
        } else {
            await showApplicationError("Error deleting title", `Error deleting title for document: ${this._document.title}`, `Error deleting title for document: ${this._document.title}`);
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}