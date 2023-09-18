import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";

export class addPersonalityModal {
    constructor() {
        if(webSkel.company.settings.personalities) {
            this._personalityConfigs = webSkel.company.settings.personalities;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._personalityConfigs = webSkel.company.settings.personalities;
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