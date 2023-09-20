import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";

export class addLLMModal {
    constructor() {
        if(webSkel.space.settings.llms) {
            this._personalityConfigs = webSkel.space.settings.llms;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._personalityConfigs = webSkel.space.settings.llms;
            this.invalidate();
        }
        webSkel.space.onChange(this.updateState);
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