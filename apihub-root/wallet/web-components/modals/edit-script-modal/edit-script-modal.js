import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { reverseQuerySelector } from "../../../../WebSkel/utils/dom-utils.js";

export class editScriptModal {
    constructor(element,invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
      let script = webSkel.space.getScript(this.element.getAttribute("data-id"));
      [this.scriptContent,this.scriptName] = [script.content,script.name];
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async saveScript(_target) {
        let body = reverseQuerySelector(_target,".modal-body").innerText;
        let scriptId = this.element.getAttribute("data-id");
        await webSkel.space.updateScript(scriptId, body);
        webSkel.space.notifyObservers(webSkel.space.getNotificationId());
        closeModal(_target);
    }
}