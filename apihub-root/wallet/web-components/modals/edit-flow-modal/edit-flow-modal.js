import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";

export class editFlowModal {
    constructor(element,invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
      let script = webSkel.currentUser.space.getFlow(this.element.getAttribute("data-id"));
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
            let flowId = this.element.getAttribute("data-id");
            await webSkel.currentUser.space.updateFlow(flowId, formInfo.data.scriptCode);
            webSkel.currentUser.space.notifyObservers(webSkel.currentUser.space.getNotificationId());
            closeModal(_target);
        }
    }
}