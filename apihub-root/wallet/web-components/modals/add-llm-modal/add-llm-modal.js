import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";

export class addLLMModal {
    constructor() {
        if(webSkel.company.settings.llms) {
            this._personalityConfigs = webSkel.company.settings.llms;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._personalityConfigs = webSkel.company.settings.llms;
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