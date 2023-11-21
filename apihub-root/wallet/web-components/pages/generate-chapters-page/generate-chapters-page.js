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
          stringHMTL+=`<div class="generated-idea">
                <div class="idea-container">
                  <span class="alt-title-span">${i}.</span>
                  <label for="${i}" class="alt-title-label">${idea}</label>
                </div>
                <input type="checkbox" id="${i}" name="${idea}" data-id="${i}" value="${idea}">
            </div>
            <hr class="generated-ideas-hr">`;
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
            let result = await webSkel.getService("GlobalFlowsService").documentFlows.generateIdeas(formInfo.data.idea, "", 5, "");
            this.ideas= result.responseJson;
            this.invalidate();
        }

    }

    async generateEmptyChapters(_target){
        let formInfo = await extractFormInformation(_target);
        let selectedIdeas = [];
        for (const [key, value] of Object.entries(formInfo.elements)) {
            if(value.element.checked) {
                selectedIdeas.push(value.element.value);
            }
        }
        let flowId = webSkel.currentUser.space.getFlowIdByName("generate empty chapters");
        let userDetails = {textarea:"Custom prompt (Optional)", number: "Number of chapters (optional)"};
        await showModal(document.querySelector("body"), "user-details-modal",
            {presenter:"user-details-modal", inputs:sanitize(JSON.stringify(userDetails)),
                flowId: flowId, ideas:sanitize(JSON.stringify(selectedIdeas)), docId: this._document.id});
    }

    async generateChapters(_target){
        let formInfo = await extractFormInformation(_target);

        let selectedIdeas = [];
        for (const [key, value] of Object.entries(formInfo.elements)) {
            if(value.element.checked) {
                selectedIdeas.push(value.element.value);
            }
        }
        let flowId = webSkel.currentUser.space.getFlowIdByName("generate chapters");
        let userDetails = {textarea:"Custom prompt (Optional)", number: "Number of chapters (optional)"};
        await showModal(document.querySelector("body"), "user-details-modal",
            {presenter:"user-details-modal", inputs:sanitize(JSON.stringify(userDetails)),
                flowId: flowId, ideas:sanitize(JSON.stringify(selectedIdeas)), docId: this._document.id});
    }

    async openMangeChaptersPage() {
        await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this._document.id}/manage-chapters-page`);
    }
    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }
}