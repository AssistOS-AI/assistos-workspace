import {
    closeModal,
    showActionBox,
    showModal,
    removeActionBox,
    reverseQuerySelector, SaveElementTimer, sanitize, parseURL
} from "../../../imports.js";
export class editAbstractPage {
    constructor(element, invalidate) {
        this.element=element;
        this._document = webSkel.currentUser.space.getDocument(parseURL());
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
            data-title="${abstract.content}" ></alternative-abstract>`;
            i++;
        });
    }


    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async proofreadAbstract(){
        await webSkel.changeToDynamicPage("abstract-proofread-page", `documents/${this._document.id}/abstract-proofread-page`);
    }

    async editAbstract(_target) {
        let abstract = this.element.querySelector(".abstract-content");
        if (abstract.getAttribute("contenteditable") === "false") {
            abstract.setAttribute("contenteditable", "true");
            abstract.focus();
            let timer = new SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = sanitize(abstract.innerText);
                if (sanitizedText !== this._document.abstract && !confirmationPopup) {
                    await this._document.updateAbstract(sanitizedText);
                    abstract.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${abstract.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            abstract.addEventListener("blur", async () => {
                abstract.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                abstract.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            abstract.addEventListener("keydown", resetTimer);
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
    async edit(_target) {

        let component = reverseQuerySelector(_target, "alternative-abstract");
        let abstractText = component.querySelector(".content");
        if(this.actionBox){
            removeActionBox(this.actionBox, this);
        }
        if (abstractText.getAttribute("contenteditable") === "false") {
            let alternativeAbstractId = component.getAttribute("data-id");
            let abstract = this._document.getAlternativeAbstract(alternativeAbstractId);
            abstractText.setAttribute("contenteditable", "true");
            abstractText.focus();
            let timer = new SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = sanitize(abstractText.innerText);
                if (sanitizedText !== abstract.content && !confirmationPopup) {
                    await this._document.updateAlternativeAbstract(abstract.id, sanitizedText);
                    abstractText.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${abstractText.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            abstractText.addEventListener("blur", async () => {
                abstractText.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                abstractText.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            abstractText.addEventListener("keydown", resetTimer);
        }
    }

    async delete(_target) {
        let abstract = reverseQuerySelector(_target, "alternative-abstract");
        this._document.deleteAlternativeAbstract(abstract.getAttribute("data-id"));
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this._document);
        this.invalidate();
    }
    async openEditAbstractPage() {
        await webSkel.changeToDynamicPage("edit-abstract-page", `documents/${this._document.id}/edit-abstract-page`);
    }
}

