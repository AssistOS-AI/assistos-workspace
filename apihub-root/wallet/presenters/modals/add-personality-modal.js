import { closeModal } from "../../../WebSkel/utils/modal-utils.js";

export class addPersonalityModal {
    constructor() {
        if(webSkel.company.personalities) {
            this._personalityConfigs = webSkel.company.personalities;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = ()=> {
            this._personalityConfigs = webSkel.company.personalities;
            this.invalidate();
        }
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