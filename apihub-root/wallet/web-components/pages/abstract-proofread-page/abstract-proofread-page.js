import {
    closeModal,
    showActionBox,
    showModal,
} from "../../../imports.js";
import { reverseQuerySelector } from "../../../../WebSkel/utils/dom-utils.js";
import { removeActionBox } from "../../../../WebSkel/utils/modal-utils.js";

export class abstractProofreadPage {
    constructor(element, invalidate) {
        this.element=element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this.invalidate = invalidate;
        this.invalidate();

    }

    beforeRender() {
        this.abstractText = this._document.abstract;
        document.removeEventListener("click", this.exitEditMode, true);
    }


    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async suggestImprovements(_target){
        const loading = await webSkel.showLoading();
        let scriptId = this._document.getScriptId("proofreadScriptId");
        let result = await webSkel.getService("LlmsService").callScript(scriptId, this.abstractText);
        this.improvedAbstract = result.responseString;
        let improvedAbstractSection = this.element.querySelector(".improved-abstract-container");
        improvedAbstractSection.style.display = "block";
        loading.close();
        loading.remove();
        this.invalidate();
    }

    async acceptImprovements(){

    }

    async enterEditMode(_target, field) {
        let abstract = this.element.querySelector(`.${field}`);
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


    async select(_target) {
        let abstract = reverseQuerySelector(_target,".content").innerText;
        if(abstract !== this._document.abstract) {
            await this._document.updateAbstract(abstract);
            await documentFactory.updateDocument(currentSpaceId, this._document);
            this._document.notifyObservers(this._document.getNotificationId());
        } else {
        }
    }

}

