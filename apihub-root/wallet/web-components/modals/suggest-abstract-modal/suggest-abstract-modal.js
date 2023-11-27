import {
    closeModal, extractFormInformation,
    sanitize
} from "../../../imports.js";

export class suggestAbstractModal {
    constructor(element, invalidate) {
        this.id = window.location.hash.split('/')[1];
        this._document = webSkel.currentUser.space.getDocument(this.id);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
    }

    beforeRender() {

    }
    afterRender(){
        this.suggestedAbstractForm = this.element.querySelector(".suggested-abstract-form");
        if(!this.suggestedAbstract){
            this.suggestedAbstractForm.style.display = "none";
        }
        let textBox = this.element.querySelector("#prompt");
        if(this.prompt){
            textBox.value = this.prompt;
        }
    }
    closeModal(_target) {
        closeModal(_target);
    }

    async generate(_target){
        let formInfo = await extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        let flowId = webSkel.currentUser.space.getFlowIdByName("suggest abstract");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this.prompt, "");
        this.suggestedAbstract = result.responseString;
        this.invalidate();
    }
    async addSelectedAbstract(_target) {
        let flowId = webSkel.currentUser.space.getFlowIdByName("AcceptSuggestedAbstract");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this.suggestedAbstract);
        this._document.notifyObservers(this._document.getNotificationId());
        closeModal(_target);
    }
}