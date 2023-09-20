import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { getClosestParentElement } from "../../../../WebSkel/utils/dom-utils.js";
import { DocumentModel } from "../../../core/models/documentModel.js";

export class addAnnouncementModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = (spaceState)=> {
            this.invalidate();
        }
        webSkel.space.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    addAnnouncementSubmitForm(_target) {
        closeModal(_target);
    }
}