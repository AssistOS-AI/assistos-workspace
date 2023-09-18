import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { Document } from "../../../core/models/document.js";
import { extractFormInformation } from "../../../imports.js";

export class addDocumentModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = (companyState)=> {
            this.invalidate();
        }
        this.documentService = webSkel.getService('documentService');
        webSkel.company.onChange(this.updateState);
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
            let document = new Document(formData.data.documentTitle);
            await this.documentService.addDocument(document);
            await webSkel.changeToStaticPage(`documents/${document.id}/edit-title`);
        }
    }
}