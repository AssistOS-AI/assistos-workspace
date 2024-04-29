export class SpaceAddDocumentModal {
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
            let response = await assistOS.callFlow("AddDocument", {
                spaceId: assistOS.space.id,
                title: formData.data.documentTitle,
                topic: formData.data.documentTopic
            });
            assistOS.UI.closeModal(_target);
            let docId = JSON.parse(response.data.id);
            await assistOS.UI.changeToDynamicPage(`space-configs-page`, `${assistOS.space.id}/SpaceConfiguration/space-document-view-page/${docId}`);
        }
    }
}
