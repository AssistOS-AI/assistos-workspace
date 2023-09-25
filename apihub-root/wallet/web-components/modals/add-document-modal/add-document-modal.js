import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { DocumentModel } from "../../../core/models/documentModel.js";
import { extractFormInformation } from "../../../imports.js";
import { DocumentFactory } from "../../../core/factories/documentFactory.js";

export class addDocumentModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = (spaceState)=> {
            this.invalidate();
        }
        // webSkel.space.onChange(this.updateState);
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
            let newDoc = DocumentFactory.createDocument();
            newDoc.setTitle(formData.data.documentTitle);
            newDoc.observeChange(newDoc.getNotifyId(), this.updateState);
            webSkel.space.addDocument(newDoc);
            await storageManager.storeObject("FileSystemStorage", currentSpaceId, "documents", newDoc.id, newDoc.stringifyDocument());
            await webSkel.changeToStaticPage(`documents/${newDoc.id}/edit-title`);
        }
    }
}