import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { reverseQuerySelector } from "../../../../WebSkel/utils/dom-utils.js";

export class editScriptModal {
    constructor(element) {
        this.element=element;
        if(webSkel.space.settings.scripts) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
    }

    beforeRender() {
      let script = webSkel.space.getScript(this.element.getAttribute("data-id"));
      this.scriptContent = script.content;
      this.scriptName = script.name;
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async saveScript(_target) {
        let body = reverseQuerySelector(_target,".modal-body").innerText;
        let scriptId = this.element.getAttribute("data-id");
        await webSkel.space.updateScript(scriptId, body);
        closeModal(_target);
        webSkel.space.notifyObservers();
    }
}