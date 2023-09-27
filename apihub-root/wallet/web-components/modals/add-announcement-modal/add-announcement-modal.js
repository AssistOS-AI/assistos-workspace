import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { getClosestParentElement } from "../../../../WebSkel/utils/dom-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";
import { Announcement } from "../../../imports.js";

export class addAnnouncementModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = (spaceState)=> {
            this.invalidate();
        }
        // webSkel.space.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addAnnouncementSubmitForm(_target) {
        let formInfo = await extractFormInformation(_target);
        closeModal(_target);
        if(formInfo.isValid) {
            let body = formInfo.data;
            let openDSU = require("opendsu");
            let crypto = openDSU.loadApi("crypto");
            body.id = crypto.getRandomSecret(16).toString().split(",").join("");
            body.date = new Date().toISOString().split('T')[0];
            webSkel.space.addAnnouncement(body);
            await Announcement.storeAnnouncement(currentSpaceId, body);
            webSkel.space.notifyObservers();
        }
    }
}