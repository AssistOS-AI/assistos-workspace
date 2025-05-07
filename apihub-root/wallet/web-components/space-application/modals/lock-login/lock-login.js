import {closeModal} from "../../../WebSkel/utils/modal-utils.js";

export class LockLogin {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){

    }

}
