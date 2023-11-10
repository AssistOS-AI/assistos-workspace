import {
    parseURL,
    closeModal, sanitize
} from "../../../imports.js";

export class summarizeChapterModal{
    constructor(element,invalidate){
        [this.documentId,this.chapterId,this.paragraphId]=parseURL();
        this._document = webSkel.space.getDocument(this.documentId);
        this._chapter=this._document.getChapter(this.chapterId);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;
        setTimeout(async()=>{
            let scriptId = webSkel.space.getScriptIdByName("summarize");
            let result = await webSkel.getService("LlmsService").callScript(scriptId, this._chapter.stringifyChapter());
            this.chapterMainIdeas = result.responseJson;
            this.invalidate();
        },0)
    }
    beforeRender(){}
    closeModal(_target) {
        closeModal(_target);
    }
    async addSelectedIdea(_target) {
        await this._chapter.setMainIdeas(this.chapterMainIdeas.map((chapterIdea)=>{return sanitize(chapterIdea)}))
        await documentFactory.updateDocument(webSkel.space.id,this._document);
        this._document.notifyObservers(this._document.getNotificationId()+":manage-paragraphs-page");
        closeModal(_target);
    }
}