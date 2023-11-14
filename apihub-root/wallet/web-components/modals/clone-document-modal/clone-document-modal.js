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

        let scriptId = webSkel.currentUser.space.getScriptIdByName("generate document");
        let result = await webSkel.getService("LlmsService").callScript(scriptId,
            formData.data.documentTitle, formData.data.documentTopic, formData.data.chaptersCount);

        let docData = result.responseJson;
        closeModal(_target);
        await webSkel.currentUser.space.addDocument(docData);

    }

    async cloneDocument(_target) {
        let formData = await extractFormInformation(_target);
        let personalityId = formData.data.documentPersonality;
        let documentTitle = formData.data.documentTitle;
        let proofread = formData.data.proofread === "on";
        let personalityDescription="copy";
        if(personalityId!=="copy"){
            personalityDescription=webSkel.currentUser.space.personalities.find(personality=>personality.id===personalityId).description;
        }
        let simplifiedDocumentJson= JSON.stringify(webSkel.currentUser.space.getDocument(webSkel.currentUser.space.currentDocumentId).simplifyDocument());
        let scriptId = webSkel.currentUser.space.getScriptIdByName("clone document");
        let result = await webSkel.getService("LlmsService").callScript(scriptId,simplifiedDocumentJson,personalityDescription, proofread);
        let docData = result.responseJson;
        docData.title = documentTitle;
        await documentFactory.addDocument(window.webSkel.currentUser.space.id, new DocumentModel(docData));
        await documentFactory.notifyObservers("docs");
        closeModal(_target);
    }
}
