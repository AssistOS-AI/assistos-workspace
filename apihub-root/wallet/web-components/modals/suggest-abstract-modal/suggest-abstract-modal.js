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
        this.detailsForm = this.element.querySelector(".details");
        this.suggestedAbstractForm = this.element.querySelector(".suggested-abstract-form");
        if(!this.suggestedAbstract){
            this.suggestedAbstractForm.style.display = "none";
        }
    }
    closeModal(_target) {
        closeModal(_target);
    }

    async generate(_target){
        let formInfo = await extractFormInformation(_target);
        let result = await webSkel.getService("GlobalFlowsService").documentFlows.suggestAbstract(this.id, formInfo.data.prompt);
        this.suggestedAbstract = result.responseString;
        this.invalidate();
    }
    async addSelectedAbstract(_target) {
        await webSkel.getService("GlobalFlowsService").documentFlows.acceptSuggestedAbstract(this.id, this.suggestedAbstract);
        this._document.notifyObservers(this._document.getNotificationId());
        closeModal(_target);
    }
}