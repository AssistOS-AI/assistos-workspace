import {
    closeModal,
    SpaceFactory,
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
            let newSpace = await SpaceFactory.createSpace(spaceData);

            await webSkel.getService("AuthenticationService").addSpaceToUser(newSpace);
            closeModal(_target);
            window.location = "";
        }
    }
}