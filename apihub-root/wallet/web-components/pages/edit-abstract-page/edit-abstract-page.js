import {
    closeModal,
    showActionBox,
    showModal,
    removeActionBox,
    reverseQuerySelector
} from "../../../imports.js";
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
            this.alternativeAbstracts += `<alternative-abstract data-nr="${i}" data-id="${abstract.id}" 
            data-title="${abstract.content}" data-local-action="edit querySelect"></alternative-abstract>`;
            i++;
        });
        document.removeEventListener("click", this.exitEditMode, true);
    }


    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async proofreadAbstract(){
        await webSkel.changeToDynamicPage("abstract-proofread-page", `documents/${this._document.id}/abstract-proofread-page`);
    }

    async enterEditMode(_target) {
        let abstract = this.element.querySelector(".abstract-content");
        const controller = new AbortController();
        document.addEventListener("click", this.exitEditMode.bind(this, abstract, controller), {signal:controller.signal});
        abstract.setAttribute("contenteditable", "true");
        abstract.focus();
    }

    async exitEditMode (abstract, controller, event) {
        if (abstract.getAttribute("contenteditable") === "true" && abstract !== event.target && !abstract.contains(event.target)) {
            abstract.setAttribute("contenteditable", "false");

            await this._document.updateAbstract(abstract.innerText);
            abstract.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
            data-message="Saved!" data-left="${abstract.offsetWidth/2}"></confirmation-popup>`);
            controller.abort();
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

    async select(_target){
        let suggestedAbstract=reverseQuerySelector(_target,"alternative-abstract");
        let suggestedAbstractId = suggestedAbstract.getAttribute("data-id");
        await this._document.selectAlternativeAbstract(suggestedAbstractId);
        removeActionBox(this.actionBox, this);
        this.invalidate();
    }
    async edit(_target, querySelect) {
        let abstractText;
        if(querySelect){
            abstractText = _target.querySelector(".content");
        }else {
            abstractText = reverseQuerySelector(_target, ".content");
        }
        let alternativeAbstractId = reverseQuerySelector(_target, "alternative-abstract").getAttribute("data-id");
        let abstract = this._document.getAlternativeAbstract(alternativeAbstractId);
        if(this.actionBox){
            removeActionBox(this.actionBox, this);
        }
        abstractText.contentEditable = true;
        abstractText.focus();
        abstractText.addEventListener('blur', async () => {
            abstractText.contentEditable = false;
            if(abstractText.innerText !== abstract.content) {
                await this._document.updateAlternativeAbstract(alternativeAbstractId, abstractText.innerText);
            }
            abstractText.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                data-message="Saved!" data-left="${abstractText.offsetWidth/2}"></confirmation-popup>`);
        });
    }

    async delete(_target) {
        let abstract = reverseQuerySelector(_target, "alternative-abstract");
        this._document.deleteAlternativeAbstract(abstract.getAttribute("data-id"));
        await documentFactory.updateDocument(currentSpaceId, this._document);
        this.invalidate();
    }
    async openEditAbstractPage() {
        await webSkel.changeToDynamicPage("edit-abstract-page", `documents/${this._document.id}/edit-abstract-page`);
    }
}

