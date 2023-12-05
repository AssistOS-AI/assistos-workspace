import {closeModal, extractFormInformation} from "../../../imports.js";

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
            let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateDocument");
            let result = await  webSkel.getService("LlmsService").callFlow(flowId, formData.data.documentTitle,
                formData.data.documentTopic, formData.data.chaptersCount, formData.data.documentPersonality, "");

        }
        closeModal(_target);
    }
}