import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";

export class AddMarketplaceModal {
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
            closeModal(_target);
            alert("Feature is currently being built!")
            //location.reload();
        }
    }
}