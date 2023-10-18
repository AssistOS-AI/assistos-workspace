import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import {DocumentModel, sanitize} from "../../../imports.js";

export class suggestAbstractModal {
    constructor(element, invalidate) {
        this.id = window.location.hash.split('/')[1];
        this._document = webSkel.space.getDocument(this.id);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;

        setTimeout(async()=>{
            const loading = await webSkel.showLoading();
            let scriptId = webSkel.space.getScriptIdByName("suggest abstract");
            let result = await webSkel.getService("LlmsService").callScript(scriptId);
            this.suggestedAbstract = result.responseString;
            loading.close();
            loading.remove();
            this.invalidate();
        },0);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addSelectedAbstract(_target) {
        this._document.addAlternativeAbstract({content:sanitize(this.suggestedAbstract), id:webSkel.getService("UtilsService").generateId()});
        await documentFactory.updateDocument(currentSpaceId, this._document);
        this._document.notifyObservers(this._document.getNotificationId());
    }
}