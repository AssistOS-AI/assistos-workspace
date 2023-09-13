import { brainstormingService, llmsService, extractFormInformation, getClosestParentElement, closeModal, showActionBox, showModal } from "../../imports.js";

export class editTitlePage {
    constructor() {
        this.docTitle = "Current Title";
        let url = window.location.hash;
        this.id = parseInt(url.split('/')[1]);
        if(webSkel.company.documents) {
            this._documentConfigs = webSkel.company.documents;
            setTimeout(() => {
                this.invalidate();
            }, 0);
        }
        this.documentService = webSkel.initialiseService('documentService');
        this.updateState = () => {
            this._documentConfigs = webSkel.company.documents;
            this._document = this.documentService.getDocument(this.id);
            this.docTitle = this._document.title;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
        this._document = this.documentService.getDocument(this.id);
        if(this._document) {
            this.docTitle = this._document.title;
            this.chapters = this._document.chapters;
        }
    }

    beforeRender() {
        this.title = `<title-edit title="${this.docTitle}"></title-edit>`;
        this.alternativeTitles = "";
        if(this._document) {
            for(let i = 0; i < this._document.alternativeTitles.length; i++) {
                this.alternativeTitles += `<alternative-title-renderer nr="${i+1}" title="${this._document.alternativeTitles[i]}"></alternative-title-renderer>`;
            }
        }
    }

    async saveTitle(_target) {
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            const documentId = webSkel.company.currentDocumentId;
            const documentIndex = webSkel.company.documents.findIndex(doc => doc.id === documentId);
            if (documentIndex !== -1 && formInfo.data.title !== webSkel.company.documents[documentIndex].title) {
                this.documentService.updateDocumentTitle(webSkel.company.documents[documentIndex], formInfo.data.title);
                this.documentService.updateDocument(webSkel.company.documents[documentIndex], webSkel.company.currentDocumentId);
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

    async showSuggestTitleModal() {
        const loading= await webSkel.showLoading();
        async function generateSuggestTitles(){
            const documentService = webSkel.initialiseService('documentService');
            const documentText = documentService.getDocument(webSkel.company.currentDocumentId).toString();
            const defaultPrompt = `Based on the following document:\n"${documentText}"\n\nPlease suggest 10 original titles that are NOT already present as chapter titles in the document. Return the titles as a JSON array.`;
            const brainstormingSrv = new brainstormingService();
            const llmId = webSkel.company.llms[0].id;
            return await brainstormingSrv.suggestTitles(defaultPrompt, llmId);
        }
        this.suggestedTitles = JSON.parse(await generateSuggestTitles()).titles;
        loading.close();
        loading.remove();
        await showModal(document.querySelector("body"), "suggest-title-modal");
    }

    select(_target) {
        let newTitle = _target.parentElement.parentElement.previousElementSibling.firstElementChild.nextElementSibling.innerText;
        const documentId = webSkel.company.currentDocumentId;
        const documentIndex = webSkel.company.documents.findIndex(doc => doc.id === documentId);
        if (documentIndex !== -1 && newTitle !== webSkel.company.documents[documentIndex].title) {
            this.documentService.updateDocumentTitle(webSkel.company.documents[documentIndex], newTitle);
            this.documentService.updateDocument(webSkel.company.documents[documentIndex], webSkel.company.currentDocumentId);
        }
    }

    edit(_target) {
        let editableTitle = _target.parentElement.parentElement.previousElementSibling.firstElementChild.nextElementSibling;
        const documentId = webSkel.company.currentDocumentId;
        const documentIndex = webSkel.company.documents.findIndex(doc => doc.id === documentId);
        if (documentIndex !== -1) {
            let currentTitleId = webSkel.company.documents[documentIndex].alternativeTitles.findIndex(title => title === editableTitle.innerText);
            if(currentTitleId !== -1) {
                editableTitle.contentEditable = true;
                editableTitle.focus();
                editableTitle.addEventListener('blur', () => {
                    editableTitle.contentEditable = false;
                    webSkel.company.documents[documentIndex].alternativeTitles[currentTitleId] = editableTitle.innerText;
                    this.documentService.updateDocument(webSkel.company.documents[documentIndex], webSkel.company.currentDocumentId);
                });
            }
        }
    }

    delete(_target) {
        let deletedTitle = _target.parentElement.parentElement.previousElementSibling.firstElementChild.nextElementSibling.innerText;
        const documentId = webSkel.company.currentDocumentId;
        const documentIndex = webSkel.company.documents.findIndex(doc => doc.id === documentId);
        if (documentIndex !== -1) {
            let altTitleId = webSkel.company.documents[documentIndex].alternativeTitles.findIndex(altTitle => altTitle === deletedTitle);
            if(altTitleId !== -1) {
                webSkel.company.documents[documentIndex].alternativeTitles.splice(altTitleId, 1);
                this.documentService.updateDocument(webSkel.company.documents[documentIndex], webSkel.company.currentDocumentId);
            }
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}