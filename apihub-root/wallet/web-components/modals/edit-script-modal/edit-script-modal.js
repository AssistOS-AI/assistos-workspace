import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import {extractFormInformation} from "../../../imports.js";
export class editScriptModal {
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
      this.content = "This is the content of the script";
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async saveScript(_target) {

    }
}