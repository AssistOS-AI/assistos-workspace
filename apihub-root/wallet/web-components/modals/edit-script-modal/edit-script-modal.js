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
        this.updateState = ()=> {
            this.invalidate();
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
        webSkel.space.updateScript(scriptId, body);
        await storageManager.storeObject(currentSpaceId, "scripts", scriptId, JSON.stringify(webSkel.space.getScript(scriptId)));
        closeModal(_target);
        //webSkel.space.notifyObservers();
    }
}