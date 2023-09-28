import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { DocumentModel } from "../../../core/models/documentModel.js";
import { extractFormInformation } from "../../../imports.js";

export class addDocumentModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
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
            let newDoc = documentFactory.createDocument();
            newDoc.setTitle(formData.data.documentTitle);
            webSkel.space.addDocument(newDoc);
            await documentFactory.storeDocument(currentSpaceId, newDoc);
            await webSkel.changeToStaticPage(`documents/${newDoc.id}/edit-title`);
        }
    }
}