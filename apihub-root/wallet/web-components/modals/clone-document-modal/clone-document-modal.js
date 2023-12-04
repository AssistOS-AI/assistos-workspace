import {
    extractFormInformation,
    closeModal,
    DocumentModel
} from "../../../imports.js";

export class cloneDocumentModal {
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        let stringHTML = `<option value="copy" selected>Copy</option>`;
        for (let personality of webSkel.currentUser.space.personalities) {
            stringHTML += `<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
        this.currentDocumentTitle = `[Clone] ${webSkel.currentUser.space.getDocument(webSkel.currentUser.space.currentDocumentId).title}`;
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async generateDocument(_target) {

        let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateDocument");
        let result = await webSkel.getService("LlmsService").callFlow(flowId,
            formData.data.documentTitle, formData.data.documentTopic, formData.data.chaptersCount);
        let docData = result.responseJson;
        closeModal(_target);

    }

    async cloneDocument(_target) {
        let formData = await extractFormInformation(_target);
        let proofread = formData.data.proofread === "on";
        let flowId = webSkel.currentUser.space.getFlowIdByName("CloneDocument");
        await webSkel.getService("LlmsService").callFlow(flowId, webSkel.currentUser.space.currentDocumentId, formData.data.documentPersonality, formData.data.documentTitle, proofread);
        await documentFactory.notifyObservers("docs");
        closeModal(_target);
    }
}
