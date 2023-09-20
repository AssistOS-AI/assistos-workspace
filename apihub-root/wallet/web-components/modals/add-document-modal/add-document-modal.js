import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { DocumentModel } from "../../../core/models/documentModel.js";
import { extractFormInformation } from "../../../imports.js";

export class addDocumentModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = (spaceState)=> {
            this.invalidate();
        }
        webSkel.space.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addDocumentSubmitForm(_target) {
        let formData = await extractFormInformation(_target);
        if(formData.isValid) {
            closeModal(_target);
            let newDoc = new DocumentModel({title: formData.data.documentTitle})
            await webSkel.servicesRegistry.documentService.addDocument(newDoc);
            await webSkel.changeToStaticPage(`documents/${newDoc.id}/edit-title`);
        }
    }
}