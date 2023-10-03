import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";
import { closeModal } from "../../../imports.js";
import { SpaceFactory } from "../../../core/factories/spaceFactory.js";

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
            let newSpace = SpaceFactory.createSpace(spaceData);
            await storageManager.storeSpace(newSpace.id, newSpace.stringifySpace());
            await webSkel.space.changeSpace(newSpace.id);
        }
    }
}