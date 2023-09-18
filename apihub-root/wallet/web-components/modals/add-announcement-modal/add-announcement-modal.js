import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { getClosestParentElement } from "../../../../WebSkel/utils/dom-utils.js";
import { Document } from "../../../core/models/document.js";

export class addAnnouncementModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate()
        }, 0);
        this.updateState = (companyState)=> {
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    addAnnounceSubmitForm(_target) {
        closeModal(_target);
    }
}