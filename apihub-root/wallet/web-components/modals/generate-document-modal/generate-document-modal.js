import {
    extractFormInformation,
    closeModal
} from "../../../imports.js";
export class generateDocumentModal{
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){
        let stringHTML = "";
        for(let personality of webSkel.currentUser.space.personalities){
            stringHTML+=`<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
    }
    closeModal(_target) {
        closeModal(_target);
    }
    async generateDocument(_target) {
        let formData = await extractFormInformation(_target);
        if(formData.isValid) {
            let scriptId = webSkel.currentUser.space.getScriptIdByName("generate document");
            let result = await  webSkel.getService("LlmsService").callScript(scriptId,
                formData.data.documentTitle, formData.data.documentTopic,formData.data.chaptersCount);

            let docData= result.responseJson;
            closeModal(_target);
            await webSkel.currentUser.space.addDocument(docData);
        }
    }
}