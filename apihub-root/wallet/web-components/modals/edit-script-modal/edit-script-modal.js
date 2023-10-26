import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import {extractFormInformation} from "../../../../WebSkel/utils/form-utils.js";

export class editScriptModal {
    constructor(element,invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
      let script = webSkel.space.getScript(this.element.getAttribute("data-id"));
      this.scriptContent = script.content;
      this.scriptName = script.name;
    }
    afterRender(){
        let scriptCode = this.element.querySelector("textarea");
        scriptCode.value = this.scriptContent;
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async saveScript(_target) {
        let form = this.element.querySelector("form")
        let formInfo = await extractFormInformation(form);
        if(formInfo.isValid) {
            let scriptId = this.element.getAttribute("data-id");
            await webSkel.space.updateScript(scriptId, formInfo.data.scriptCode);
            webSkel.space.notifyObservers(webSkel.space.getNotificationId());
            closeModal(_target);
        }
    }
}