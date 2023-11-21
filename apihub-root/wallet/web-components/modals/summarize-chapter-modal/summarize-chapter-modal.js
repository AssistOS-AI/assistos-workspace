import {
    parseURL,
    closeModal, sanitize
} from "../../../imports.js";

export class summarizeChapterModal{
    constructor(element,invalidate){
        [this.documentId,this.chapterId,this.paragraphId]=parseURL();
        this._document = webSkel.currentUser.space.getDocument(this.documentId);
        this._chapter=this._document.getChapter(this.chapterId);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;
        setTimeout(async()=>{
            let flowId = webSkel.currentUser.space.getFlowIdByName("summarize");
            let result = await webSkel.getService("LlmsService").callFlow(flowId, this._chapter.stringifyChapter());
            this.chapterMainIdeas = result.responseJson;
            this.invalidate();
        },0)
    }
    beforeRender(){}
    closeModal(_target) {
        closeModal(_target);
    }

    generate(){

    }
    async addSelectedIdea(_target) {
        await this._chapter.setMainIdeas(this.chapterMainIdeas.map((chapterIdea)=>{return sanitize(chapterIdea)}))
        await documentFactory.updateDocument(webSkel.currentUser.space.id,this._document);
        this._document.notifyObservers(this._document.getNotificationId()+":manage-paragraphs-page");
        closeModal(_target);
    }
}