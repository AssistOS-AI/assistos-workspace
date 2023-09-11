import { closeModal } from "../../../WebSkel/utils/modal-utils.js";
import { getClosestParentElement } from "../../../WebSkel/utils/dom-utils.js";
import { Document } from "../../core/models/document.js";

export class addNewDocumentModal {
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
        this.documentService = webSkel.initialiseService('documentService');
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addDocumentSubmitForm(_target) {
        let documentTitle= new FormData(getClosestParentElement(_target,'form')).get("documentTitle");
        if(documentTitle !== "") {
            closeModal(_target);
            await this.documentService.addDocument(new Document(documentTitle));
        } else {
            closeModal(_target);
            await showApplicationError("Please enter a title for the document", "Title cannot be null", `The title "${documentTitle}" is not valid. Please enter a valid title for the document`);
        }
    }
}