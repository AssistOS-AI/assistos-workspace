import {
    closeModal,
    SpaceFactory,
    extractFormInformation
} from "../../../imports.js";

export class userPromptModal {
    constructor(element,invalidate){
       this.invalidate=invalidate;
       this.invalidate();
       this.element = element;
       this.selectedIdeas = this.element.getAttribute("data-ideas");
       let docId = this.element.getAttribute("docId");
       this._document = webSkel.currentUser.space.getDocument(docId);
    }
    closeModal(_target) {
        closeModal(_target);
    }
    beforeRender() {}

    async generateChapters(_target){
        let formInfo = extractFormInformation(_target);

        let flowId = webSkel.currentUser.space.getFlowIdByName("generate chapters");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, this.selectedIdeas, formInfo.data.userPrompt, this._document.id);
        if(result.responseJson){
            await this._document.addChapters(result.responseJson, JSON.parse(this.selectedIdeas));
            await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this._document.id}/manage-chapters-page`);
        }else {
            await showApplicationError("Flow execution error",
                "Data received from LLM is an incorrect format", `result from LLM: ${result}`);
        }
        closeModal(_target);

    }
}