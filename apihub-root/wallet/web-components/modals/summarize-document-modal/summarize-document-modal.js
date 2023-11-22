import {
    parseURL,
    closeModal, sanitize, extractFormInformation
} from "../../../imports.js";

export class summarizeDocumentModal{
    constructor(element,invalidate){
        let documentId = parseURL();
        this._document = webSkel.currentUser.space.getDocument(documentId);
        this._document.observeChange(this._document.getNotificationId() + ":manage-chapters-page", invalidate);
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
        this.documentMainIdeas = [];
    }
    beforeRender(){
        let string = "";
        for(let idea of this.documentMainIdeas){
            string += `<li>${sanitize(idea)}</li>`;
        }
        this.mainIdeas = string;
    }
    afterRender(){
        this.suggestedIdeasForm = this.element.querySelector(".suggested-ideas-form");
        if(this.documentMainIdeas.length === 0){
            this.suggestedIdeasForm.style.display = "none";
        }
        let textBox = this.element.querySelector("#prompt");
        if(this.prompt){
            textBox.value = this.prompt;
        }
    }
    async generate(_target){
        let formInfo = await extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        let result = await webSkel.getService("GlobalFlowsService").documentFlows.summarizeDocument(this._document.id, this.prompt, "");
        this.documentMainIdeas = result.responseJson;
        this.invalidate();
    }
    closeModal(_target) {
        closeModal(_target);
    }
    async addSelectedIdeas(_target) {
        await webSkel.getService("GlobalFlowsService").documentFlows.acceptDocumentIdeas(this._document.id, this.documentMainIdeas);
        this._document.notifyObservers(this._document.getNotificationId() + ":manage-chapters-page");
        closeModal(_target);


    }
}