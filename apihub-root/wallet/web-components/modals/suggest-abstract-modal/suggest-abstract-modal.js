import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import {documentService} from "../../../core/services/documentService.js";

export class suggestAbstractModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate()
        }, 0);

        this.updateState = ()=> {
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
        this.suggestedAbstract = document.querySelector("edit-abstract-page").webSkelPresenter.suggestedAbstract;
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addSelectedAbstract(_target) {
        let currentDocument = webSkel.serviceRegistry.documentService.getDocument(webSkel.company.currentDocumentId);
        webSkel.serviceRegistry.documentService.addAlternativeAbstract(currentDocument,this.suggestedAbstract);
        await webSkel.serviceRegistry.documentService.updateDocument(currentDocument, currentDocument.id);
    }
}