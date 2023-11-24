import {extractFormInformation, parseURL, sanitize, showModal} from "../../../imports.js";
export class generateChaptersPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.currentUser.space.getDocument(parseURL());
        this.invalidate = invalidate;
        this.invalidate();
        this.ideas = [];
    }

    beforeRender() {
      let stringHMTL = "";
        let i = 0;
        for(let idea of this.ideas){
          i++;
          if(i === this.ideas.length){
              stringHMTL+=`<div class="generated-idea" data-id="${i+idea}">
                <div class="idea-container">
                  <span class="alt-title-span">${i}.</span>
                  <label for="${i+idea}" class="alt-title-label">${idea}</label>
                </div>
                <input type="checkbox" id="${i+idea}" name="${i+idea}" value="${idea}" data-condition="verifyCheckedIdeas">
            </div>
            <hr class="generated-ideas-hr">`;
          }else {
              stringHMTL+=`<div class="generated-idea" data-id="${i}">
                <div class="idea-container">
                  <span class="alt-title-span">${i}.</span>
                  <label for="${i}" class="alt-title-label">${idea}</label>
                </div>
                <input type="checkbox" id="${i}" name="${idea}" value="${idea}">
            </div>
            <hr class="generated-ideas-hr">`;
          }
        }
        this.chaptersIdeas = stringHMTL;
    }

    preventRefreshOnEnter(event){
        if(event.key === "Enter"){
            event.preventDefault();
            this.element.querySelector(".generate-ideas-btn").click();
        }
    }
    afterRender(){
        if(this.ideas.length !== 0){
            let ideasListContainer = this.element.querySelector(".ideas-list-container");
            ideasListContainer.style.display = "block";
        }
        this.ideaInput = this.element.querySelector("#idea");
        let boundFn = this.preventRefreshOnEnter.bind(this);
        this.ideaInput.removeEventListener("keypress", boundFn);
        this.ideaInput.addEventListener("keypress", boundFn);
    }

    async generateIdeas(){
        let form = this.element.querySelector(".generate-ideas-form");
        let formInfo = await extractFormInformation(form);
        if(formInfo.isValid) {
            let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateIdeas");
            let result = await webSkel.getService("LlmsService").callFlow(flowId, formInfo.data.idea, "", formInfo.data.nr, "");
            this.ideas= result.responseJson;
            this.invalidate();
        }

    }

    async generateEmptyChapters(_target){
        const conditions = {"verifyCheckedIdeas": {fn:this.verifyCheckedIdeas, errorMessage:"Select at least one idea!"} };
        let formInfo = await extractFormInformation(_target, conditions);
        let selectedIdeas = [];
        for (const [key, value] of Object.entries(formInfo.elements)) {
            if(value.element.checked) {
                selectedIdeas.push(value.element.value);
            }
        }
        let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateEmptyChapters");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, selectedIdeas, this._document.id, formInfo.data.prompt, selectedIdeas.length);
        if(result){
            await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this._document.id}/manage-chapters-page`);
        }
    }

    verifyCheckedIdeas(element, formData) {
        let checkedIdeas = [];
        for (const [key, value] of Object.entries(formData.elements)) {
        if(value.element.checked) {
            checkedIdeas.push(value.element.value);
            }
        }
        if(element.checked){
            checkedIdeas.push(element.value);
        }
        return checkedIdeas.length !== 0;
    }
    async generateChapters(_target){
        const conditions = {"verifyCheckedIdeas": {fn:this.verifyCheckedIdeas, errorMessage:"Select at least one idea!"} };
        let formInfo = await extractFormInformation(_target, conditions);
        if(formInfo.isValid){
            let selectedIdeas = [];
            for (const [key, value] of Object.entries(formInfo.elements)) {
                if(value.element.checked) {
                    selectedIdeas.push(value.element.value);
                }
            }
            let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateChapters");
            let result = await webSkel.getService("LlmsService").callFlow(flowId, selectedIdeas, this._document.id, formInfo.data.prompt, selectedIdeas.length);
            if(result){
                await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this._document.id}/manage-chapters-page`);
            }
        }
    }

    async openMangeChaptersPage() {
        await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this._document.id}/manage-chapters-page`);
    }
    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }
}