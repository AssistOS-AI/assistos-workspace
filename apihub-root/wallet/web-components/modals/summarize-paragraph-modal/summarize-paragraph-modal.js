import {
    parseURL,
    closeModal, sanitize
} from "../../../imports.js";

export class summarizeParagraphModal{
    constructor(element,invalidate){
        [this.documentId,this.chapterId,this.paragraphId]=parseURL();
        this._document = webSkel.currentUser.space.getDocument(this.documentId);
        this._chapter=this._document.getChapter(this.chapterId);
        this._paragraph=this._chapter.getParagraph(this.paragraphId);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;
        setTimeout(async()=>{
            let flowId = webSkel.currentUser.space.getFlowIdByName("summarize paragraph");
            let result = await webSkel.getService("LlmsService").callFlow(flowId,this._paragraph.toString());
            this.paragraphMainIdea = result.responseString;
            this.invalidate();
        },0)
    }
    beforeRender(){}
    closeModal(_target) {
        closeModal(_target);
    }
    async addSelectedIdea(_target) {
        await this._paragraph.setMainIdea(sanitize(this.paragraphMainIdea));
        await documentFactory.updateDocument(webSkel.currentUser.space.id,this._document);
        this._document.notifyObservers(this._document.getNotificationId());
        closeModal(_target);
    }
}