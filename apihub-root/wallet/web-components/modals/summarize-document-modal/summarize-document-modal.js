import {
    parseURL,
    closeModal, sanitize
} from "../../../imports.js";

export class summarizeDocumentModal{
    constructor(element,invalidate){
        this.documentId=parseURL();
        this._document = webSkel.space.getDocument(this.documentId);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;

        setTimeout(async()=>{
            let scriptId = webSkel.space.getScriptIdByName("summarize");
            let result = await webSkel.getService("LlmsService").callScript(scriptId, this._document.stringifyDocument());
            this.documentMainIdeas = result.responseJson;
            this.invalidate();
        },0)
    }
    beforeRender(){}
    closeModal(_target) {
        closeModal(_target);
    }
    async addSelectedIdea(_target) {
        await this._document.setMainIdeas(this.documentMainIdeas.map((documentIdea)=>{return sanitize(documentIdea)}));
        this._document.notifyObservers(this._document.getNotificationId()+":manage-chapters-page");
        closeModal(_target);
    }
}