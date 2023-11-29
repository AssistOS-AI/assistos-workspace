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
            let spaceData={name:formData.data.name};
            let flowId = webSkel.currentUser.space.getFlowIdByName("AddSpace");
            await webSkel.getService("LlmsService").callFlow(flowId, spaceData);
            closeModal(_target);
            window.location = "";
        }
    }
}