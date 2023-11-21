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
            await webSkel.getService("GlobalFlowsService").documentFlows.generateDocument(formData.data);
            closeModal(_target);
        }
    }
}