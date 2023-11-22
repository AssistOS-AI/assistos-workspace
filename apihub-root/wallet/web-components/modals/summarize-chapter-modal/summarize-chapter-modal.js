import {
    parseURL,
    closeModal, sanitize, extractFormInformation
} from "../../../imports.js";

export class summarizeChapterModal{
    constructor(element,invalidate){
        [this.documentId,this.chapterId,this.paragraphId]=parseURL();
        this._document = webSkel.currentUser.space.getDocument(this.documentId);
        this._chapter=this._document.getChapter(this.chapterId);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
        this.chapterMainIdeas = [];
    }
    beforeRender(){
        let string = "";
        for(let idea of this.chapterMainIdeas){
            string += `<li>${sanitize(idea)}</li>`;
        }
        this.mainIdeas = string;
    }
    afterRender(){
        this.suggestedIdeasForm = this.element.querySelector(".suggested-ideas-form");
        if(this.chapterMainIdeas.length === 0){
            this.suggestedIdeasForm.style.display = "none";
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
        let result = await webSkel.getService("GlobalFlowsService").documentFlows.summarizeChapter(this._document.id, this._chapter.id, this.prompt, "");
        this.chapterMainIdeas = result.responseJson;
        this.invalidate();
    }
    async addSelectedIdeas(_target) {
        await webSkel.getService("GlobalFlowsService").documentFlows.acceptChapterIdeas(this._document.id, this._chapter.id, this.chapterMainIdeas);
        this._document.notifyObservers(this._document.getNotificationId()+":manage-paragraphs-page");
        closeModal(_target);
    }
}