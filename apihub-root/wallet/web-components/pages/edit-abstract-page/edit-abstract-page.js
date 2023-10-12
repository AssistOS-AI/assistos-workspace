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
        this.abstractText=this._document.abstract;
        this.alternativeAbstracts = "";
        let i = 1;
        this._document.alternativeAbstracts.forEach((abstract)=>{
            this.alternativeAbstracts += `<alternative-abstract data-nr="${i}" data-id="${abstract.id}" data-title="${abstract.content}"></alternative-abstract>`;
            i++;
        });
        document.removeEventListener("click", this.removeEventForDocument, true);
    }


    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async proofreadAbstract(){
        console.log("changed page to abstract proofreader");
    }

    async enterEditMode(_target) {
        let abstract = this.element.querySelector(".abstract-content");
        abstract.setAttribute("contenteditable", "true");
        abstract.focus();
        document.addEventListener("click", this.exitEditMode.bind(this, abstract), true);
    }

    async exitEditMode (abstract, event) {
        if (abstract.getAttribute("contenteditable") && !abstract.contains(event.target)) {
            abstract.setAttribute("contenteditable", "false");
            this._document.updateAbstract(abstract.innerText);
            await documentFactory.updateDocument(currentSpaceId, this._document);
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async suggestAbstract(_target){
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
}

