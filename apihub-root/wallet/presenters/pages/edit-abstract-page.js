import {
    brainstormingService,
    closeModal,
    documentService,
    getClosestParentElement,
    showActionBox,
    showModal
} from "../../imports.js";
import { reverseQuerySelector } from "../../../WebSkel/utils/dom-utils.js";

export class editAbstractPage {
    constructor(element) {
        this.element = element;
        let url = window.location.hash;
        this.id = parseInt(url.split('/')[1]);
        if (webSkel.company.documents) {
            setTimeout(() => {
                this.invalidate();
            }, 0);
        }
        this.updateState = () => {
            this.abstractText = this._document.abstract;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
        this.documentService = webSkel.initialiseService('documentService');
        this._document = this.documentService.getDocument(this.id);
        this.abstractText = this._document.abstract;
    }

    beforeRender() {
        this.title = `<title-view title="${this._document.title}"></title-view>`;
        this.alternativeAbstracts = "";
        for (let i = 0; i < this._document.alternativeAbstracts.length; i++) {
            this.alternativeAbstracts += `<alternative-abstract-renderer nr="${i}" title="${this._document.alternativeAbstracts[i]}"></alternative-abstract-renderer>`;
        }
        if(!this._document.mainIdeas || this._document.mainIdeas.length === 0) {
            this.generateMainIdeasButtonName = "Summarize";
        } else {
            this.generateMainIdeasButtonName = "Regenerate";
        }
        if (this.editableAbstract) {
            this.editableAbstract.removeEventListener("click", setEditableAbstract);
            document.removeEventListener("click", removeEventForDocument, true);
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

    async saveAbstract() {
        let updatedAbstract = document.querySelector(".abstract-content").innerText;
        const documentIndex = webSkel.company.documents.findIndex(doc => doc.id === this.id);
        if (documentIndex !== -1 && updatedAbstract !== this.documentService.getAbstract(this._document)) {
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
            this.documentService.updateAbstract(this._document, updatedAbstract)
            await this.documentService.updateDocument(this._document, this._document.id);
        }
    }

    afterRender() {
        this.editableAbstract = this.element.querySelector("#editable-abstract");
        this.editableAbstract.addEventListener("dblclick", setEditableAbstract);
        document.addEventListener("click", removeEventForDocument, true);
        document.editableAbstract = this.editableAbstract;
    }


    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox=await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    closeModal(_target) {
        closeModal(_target);
    }
    async generateAbstract(_target){
        const loading= await webSkel.showLoading();
        async function suggestAbstract(){
            const documentService = webSkel.initialiseService('documentService');
            const documentText = documentService.getDocument(webSkel.company.currentDocumentId).toString();
            const defaultPrompt = `Given the content of the following document: "${documentText}". Please generate a concise and contextually appropriate abstract that accurately reflects the document's key points, themes, and findings. Your response should consist solely of the abstract text.`;
            const brainstormingSrv = new brainstormingService();
            const llmId = webSkel.company.llms[0].id;
            return await brainstormingSrv.suggestAbstract(defaultPrompt, llmId);
        }
        this.suggestedAbstract = await suggestAbstract();
        webSkel.company.notifyObservers();
        loading.close();
        loading.remove();
        await showModal(document.querySelector("body"), "suggest-abstract-modal");
    }

    async select(_target) {
        let abstract = reverseQuerySelector(_target,".content").innerText;
        let documentSrv=new documentService();
        if(abstract!==documentSrv.getAbstract(this._document)) {
            documentSrv.updateAbstract(this._document, abstract);
            await documentSrv.updateDocument(this._document,this._document.id);
        }
        else {
            this.actionBox.remove();
            this.actionBox.removeAEventListener('click',this.clickHandler);
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

