import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { Document } from "../../../core/models/document.js";
import { extractFormInformation } from "../../../imports.js";

export class addDocumentModal {
    constructor() {
        if(webSkel.company.documents) {
            this._documentConfigs = webSkel.company.documents;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = (companyState)=> {
            this._documentConfigs = webSkel.company.documents;
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
            await this.documentService.addDocument(new Document(formData.data.documentTitle));
        }
    }
}