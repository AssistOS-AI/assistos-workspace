import {
    extractFormInformation,
    closeModal
} from "../../../imports.js";

export class addDocumentModal {
    constructor(element,invalidate) {
       this.invalidate=invalidate;
       this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        closeModal(_target);
    }

    async addDocument(_target) {
        let formData = await extractFormInformation(_target);
        if(formData.isValid) {
            let docData={
                title: formData.data.documentTitle,
                topic: formData.data.documentTopic
            }
            await webSkel.currentUser.space.addDocument(docData);
            closeModal(_target);
        }
    }
}