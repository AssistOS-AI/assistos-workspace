const documentModule = require("assistos").loadModule("document", {});
export class AddDocumentModal {
    constructor(element,invalidate) {
       this.invalidate=invalidate;
       this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async addDocument(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if(formData.isValid) {
            let docId = await documentModule.addDocument(assistOS.space.id, {
                title: formData.data.documentTitle,
                topic: formData.data.documentTopic
            });
            assistOS.UI.closeModal(_target);
            await assistOS.UI.changeToDynamicPage(`space-application-page`, `${assistOS.space.id}/Space/document-view-page/${docId}`);
        }
    }
}
