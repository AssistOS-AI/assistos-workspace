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
        for (let personality of webSkel.space.settings.personalities) {
            stringHTML += `<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
        this.currentDocumentTitle = `[Clone] ${webSkel.space.getDocument(webSkel.space.currentDocumentId).title}`;
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async generateDocument(_target) {

        let scriptId = webSkel.space.getScriptIdByName("generate document");
        let result = await webSkel.getService("LlmsService").callScript(scriptId,
            formData.data.documentTitle, formData.data.documentTopic, formData.data.chaptersCount);

        let docData = result.responseJson;
        closeModal(_target);
        await webSkel.space.addDocument(docData);

    }

    async cloneDocument(_target) {
        let formData = await extractFormInformation(_target);
        let personalityId = formData.data.documentPersonality;
        let documentTitle = formData.data.documentTitle;
        let proofread = formData.data.proofread === "on";
        let personalityDescription="copy";
        if(personalityId!=="copy"){
            personalityDescription=webSkel.space.settings.personalities.find(personality=>personality.id===personalityId).description;
        }
        let simplifiedDocumentJson= JSON.stringify(webSkel.space.getDocument(webSkel.space.currentDocumentId).simplifyDocument());
        let scriptId = webSkel.space.getScriptIdByName("clone document");
        let result = await webSkel.getService("LlmsService").callScript(scriptId,simplifiedDocumentJson,personalityDescription, proofread);
        let docData = result.responseJson;
        docData.title = documentTitle;
        await documentFactory.addDocument(window.currentSpaceId, new DocumentModel(docData));
        await documentFactory.notifyObservers("docs");
        closeModal(_target);
    }
}
