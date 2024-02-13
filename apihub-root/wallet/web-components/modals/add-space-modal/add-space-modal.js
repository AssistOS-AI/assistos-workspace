import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";

export class addSpaceModal {
    constructor(element,invalidate){
       this.invalidate=invalidate;
         this.invalidate();
    }
    closeModal(_target) {
        closeModal(_target);
    }
    beforeRender() {}

    async addSpace(_target){
        let formData = await extractFormInformation(_target);
        if(formData.isValid) {

            let flowId = webSkel.currentUser.space.getFlowIdByName("AddSpace");
            await webSkel.appServices.callFlow(flowId, formData.data.name);
            closeModal(_target);
            window.location = "";
        }
    }
}