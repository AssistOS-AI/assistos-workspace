import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { DocumentModel } from "../../../core/models/documentModel.js";
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
            let document = new DocumentModel(formData.data.documentTitle, undefined, undefined, undefined, undefined, undefined, undefined, [formData.data.documentIdea]);
            await this.documentService.addDocument(document);
            await webSkel.changeToStaticPage(`documents/${document.id}/edit-title`);
        }
    }
}