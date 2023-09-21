import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { documentService } from "../../../core/_old/documentService.js";

export class suggestAbstractModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
        // webSkel.space.onChange(this.updateState);
        this.id = parseInt(window.location.hash.split('/')[1]);
        this._document = webSkel.servicesRegistry.documentService.getDocument(this.id);
        this._document.observeChange(this.updateState);
        this.suggestedAbstract = document.querySelector("edit-abstract-page").webSkelPresenter.suggestedAbstract;
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addSelectedAbstract(_target) {
        webSkel.servicesRegistry.documentService.addAlternativeAbstract(this._document, this.suggestedAbstract);
        await webSkel.servicesRegistry.documentService.updateDocument(this._document, this.id);
    }
}