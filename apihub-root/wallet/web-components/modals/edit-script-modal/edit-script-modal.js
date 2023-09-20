import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import {reverseQuerySelector} from "../../../../WebSkel/utils/dom-utils.js";

export class editScriptModal {
    constructor(element) {
        this.element=element;
        if(webSkel.space.settings.scripts) {
            this._scriptsConfigs = webSkel.space.settings.scripts;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._scriptsConfigs = webSkel.space.settings.scripts;
            this.invalidate();
        }
        webSkel.space.onChange(this.updateState);
    }

    beforeRender() {
      let script = this._scriptsConfigs.find(script => script.id === this.element.getAttribute("data-id"));
      this.scriptContent = script.content;
      this.scriptName = script.name;
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async saveScript(_target) {
        let body = reverseQuerySelector(_target,".modal-body").innerText;
        let scriptId = this.element.getAttribute("data-id");
        let response = await fetch(`/space/${window.currentSpaceId}/myspace/scripts/edit/${scriptId}`, {
            method: "PUT",
            body: body,
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        });

        console.log(response);
        closeModal(_target);
        webSkel.space.notifyObservers();
    }
}