export class SpaceAddDocumentModal {
    constructor(element,invalidate) {
       this.invalidate=invalidate;
       this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        system.UI.closeModal(_target);
    }

    async addDocument(_target) {
        let formData = await system.UI.extractFormInformation(_target);
        if(formData.isValid) {
            let flowId = system.space.getFlowIdByName("AddDocument");
            let context = {
                title: formData.data.documentTitle,
                topic: formData.data.documentTopic
            }
            let docId = await system.services.callFlow(flowId, context);
            docId.responseString? docId = docId.responseString : docId = docId.responseJson;
            system.UI.closeModal(_target);
            await system.UI.changeToDynamicPage(`space-configs-page`, `${system.space.id}/SpaceConfiguration/space-document-view-page/${docId}`);
        }
    }
}
