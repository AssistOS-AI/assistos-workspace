import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../imports.js";
export class generateDocumentModal{
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){}
    closeModal(_target) {
        closeModal(_target);
    }
    async generateDocument(_target) {
        let formData = await extractFormInformation(_target);
        if(formData.isValid) {
            let docData={
                title: formData.data.documentTitle,
                topic: formData.data.documentIdea,
                chaptersCount:formData.data.chaptersCount,
                personality:formData.data.personality
            }
            //await webSkel.space.addDocument(docData);
            closeModal(_target);
        }
    }
}