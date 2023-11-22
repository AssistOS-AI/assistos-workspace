import {
    parseURL,
    closeModal, sanitize, extractFormInformation
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
        this.invalidate();
    }
    beforeRender(){}
    afterRender(){
        this.suggestedIdeaForm = this.element.querySelector(".suggested-idea-form");
        if(!this.paragraphMainIdea){
            this.suggestedIdeaForm.style.display = "none";
        }
        let textBox = this.element.querySelector("#prompt");
        if(this.prompt){
            textBox.value = this.prompt;
        }
    }
    async generate(_target){
        let formInfo = await extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        let result = await webSkel.getService("GlobalFlowsService").documentFlows.summarizeParagraph(this._document.id, this._chapter.id, this._paragraph.id, this.prompt, "");
        this.paragraphMainIdea = result.responseString;
        this.invalidate();
    }
    closeModal(_target) {
        closeModal(_target);
    }
    async addSelectedMainIdea(_target) {
        await webSkel.getService("GlobalFlowsService").documentFlows.acceptParagraphIdea(this._document.id, this._chapter.id, this._paragraph.id, this.paragraphMainIdea);
        this._document.notifyObservers(this._document.getNotificationId());
        closeModal(_target);
    }
}