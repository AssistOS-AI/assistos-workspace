import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";
import { closeModal, Space } from "../../../imports.js";
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
    generateDefaultAnnouncement() {

    }

    async addSpace(_target){
        let formData = await extractFormInformation(_target);
        if(formData.isValid) {


            let currentDate = new Date();
            let today = currentDate.toISOString().split('T')[0];
            let textString = "Space " + formData.data.name + " was successfully created. You can now add documents, users and settings to your space.";
            let newAnnouncements = [{
                id: 1,
                title: "Welcome to AIAuthor!",
                text: textString,
                date: today
            }];
            let newSpace = SpaceFactory.createSpace(formData.data.name);
            newSpace.announcements = newAnnouncements;
            await storageManager.storeSpace(newSpace.id, newSpace.stringifySpace());
            await webSkel.space.changeSpace(newSpace.id);
        }
    }
}