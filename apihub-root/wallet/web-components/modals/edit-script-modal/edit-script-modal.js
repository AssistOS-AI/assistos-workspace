import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../imports.js";

export class editScriptModal {
    constructor() {
        if(webSkel.space.settings.personalities) {
            this._personalityConfigs = webSkel.space.settings.personalities;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._personalityConfigs = webSkel.space.settings.personalities;
            this.invalidate();
        }
        webSkel.space.onChange(this.updateState);
    }

    beforeRender() {
      this.content = "This is the content of the script";
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async saveScript(_target) {

    }
}