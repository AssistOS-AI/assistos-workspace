import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";

export class addPersonalityModal {
    constructor() {
        if(webSkel.company.settings.personalities) {
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = ()=> this.invalidate();

        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {
    }

    closeModal(_target) {
        closeModal(_target);
    }

    submitForm(_target) {
        closeModal(_target);
    }
}