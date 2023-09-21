import {
    brainstormingService,
    extractFormInformation,
    getClosestParentElement,
    closeModal,
    showActionBox,
    showModal,
    documentService
} from "../../../imports.js";
import { reverseQuerySelector } from "../../../../WebSkel/utils/dom-utils.js";
import { removeActionBox } from "../../../../WebSkel/utils/modal-utils.js";

export class editTitlePage {
    constructor() {
        this.docTitle = "Current Title";
        let url = window.location.hash;
        this.id = parseInt(url.split('/')[1]);
        this.documentService = webSkel.getService('documentService');
        this.brainstormingService = webSkel.getService('brainstormingService');
        this._document = this.documentService.getDocument(this.id);
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
            this._document = this.documentService.getDocument(this.id);
            this.docTitle = this._document.getTitle();
            this.invalidate();
        }
        this._document.observeChange(this.updateState);
        // webSkel.space.onChange(this.updateState);
    }

    beforeRender() {
        this.title = `<title-edit title="${this.docTitle}"></title-edit>`;
        this.alternativeTitles = "";
        if(this._document) {
            this._document.getAlternativeTitles().forEach((alternativeTitle) => {
                this.alternativeTitles += `<alternative-title nr="${i+1}" title="${alternativeTitle}"></alternative-title>`;
            });
        }
    }

    async saveTitle(_target) {
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            if (formInfo.data.title !== this._document.getTitle()) {
                this._document.updateDocumentTitle(formInfo.data.title);
                await this.documentService.updateDocument(this._document, this.id);
            }
        }
    }

    openEditTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-title`);
    }

    openEditAbstractPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-abstract`);
    }

    openDocumentSettingsPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/settings`);
    }

    openBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/brainstorming`);
    }

    openViewPage() {
        webSkel.changeToStaticPage(`documents/${this.id}`);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async showSuggestTitlesModal() {
        const loading = await webSkel.showLoading();
        async function generateSuggestTitles(){
            const documentText = this.documentService.getDocument(this.id).toString();
            const defaultPrompt = `Based on the following document:\n"${documentText}"\n\nPlease suggest 10 original titles that are NOT already present as chapter titles in the document. Return the titles as a JSON array.`;
            if(webSkel.space.settings.llms.length <= 0) {
                loading.close();
                loading.remove();
                await showApplicationError("Space has no LLMs", "Space has no LLMS", "Space has no LLMS");
                return;
            }
            const llmId = webSkel.space.settings.llms[0].id;
            return await this.brainstormingService.suggestTitles(defaultPrompt, llmId);
        }
        this.suggestedTitles = JSON.parse(await generateSuggestTitles()).titles;
        loading.close();
        loading.remove();
        await showModal(document.querySelector("body"), "suggest-titles-modal", { presenter: "suggest-titles-modal"});
    }

    async select(_target) {
        let selectedTitle = reverseQuerySelector(_target,".suggested-title").innerText;
        if(selectedTitle !== this._document.getTitle()) {
            this._document.updateTitle(selectedTitle);
            await this.documentService.updateDocument(this._document, this._document.id);
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
                    await this.documentService.updateDocument(this._document, this._document.id);
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
            await this.documentService.updateDocument(this._document, this._document.id);
        } else {
            await showApplicationError("Error deleting title", `Error deleting title for document: ${this._document.title}`, `Error deleting title for document: ${this._document.title}`);
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}