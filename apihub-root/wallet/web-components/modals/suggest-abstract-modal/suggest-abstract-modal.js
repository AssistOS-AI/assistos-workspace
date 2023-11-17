import {
    closeModal,
    sanitize
} from "../../../imports.js";

export class suggestAbstractModal {
    constructor(element, invalidate) {
        this.id = window.location.hash.split('/')[1];
        this._document = webSkel.currentUser.space.getDocument(this.id);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;

        setTimeout(async()=>{
            let flowId = webSkel.currentUser.space.getFlowIdByName("suggest abstract");
            let result = await webSkel.getService("LlmsService").callFlow(flowId, this._document.stringifyDocument());
            this.suggestedAbstract = result.responseString;
            this.invalidate();
        },0);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addSelectedAbstract(_target) {
        await this._document.addAlternativeAbstract({content:sanitize(this.suggestedAbstract), id:webSkel.getService("UtilsService").generateId()});
        this._document.notifyObservers(this._document.getNotificationId());
        closeModal(_target);
    }
}