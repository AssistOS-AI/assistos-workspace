import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { documentService } from "../../../core/services/documentService.js";

export class suggestAbstractModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
        webSkel.space.onChange(this.updateState);
        this.suggestedAbstract = document.querySelector("edit-abstract-page").webSkelPresenter.suggestedAbstract;
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addSelectedAbstract(_target) {
        let currentDocument = webSkel.servicesRegistry.documentService.getDocument(parseInt(window.location.hash.split('/')[1]));
        webSkel.servicesRegistry.documentService.addAlternativeAbstract(currentDocument, this.suggestedAbstract);
        await webSkel.servicesRegistry.documentService.updateDocument(currentDocument, currentDocument.id);
    }
}