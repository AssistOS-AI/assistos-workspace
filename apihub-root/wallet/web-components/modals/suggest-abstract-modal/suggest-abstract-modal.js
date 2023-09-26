import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { DocumentModel } from "../../../imports.js";

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
        this._document = webSkel.space.getDocument(this.id);
        this._document.observeChange(this._document.getNotifyId(), this.updateState);
        this.suggestedAbstract = document.querySelector("edit-abstract-page").webSkelPresenter.suggestedAbstract;
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addSelectedAbstract(_target) {
        this._document.addAlternativeAbstract(this.suggestedAbstract);
        await storageManager.storeObject("FileSystemStorage", currentSpaceId, "documents", this._document.id, this._document.stringifyDocument());
    }
}