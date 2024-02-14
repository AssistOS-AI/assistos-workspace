import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";

export class addMarketplaceModal {
    constructor(element,invalidate){
       this.invalidate=invalidate;
         this.invalidate();
    }
    closeModal(_target) {
        closeModal(_target);
    }
    beforeRender() {}

    async addMarketplace(_target){
        let formData = await extractFormInformation(_target);
        if(formData.isValid) {
            //let flowId = webSkel.currentUser.space.getFlowIdByName("AddMarketplace");
            //await webSkel.appServices.callFlow(flowId, formData.data.name, formData.data.url);
            closeModal(_target);
            alert("Feature is currently being built!")
            //location.reload();
        }
    }
}