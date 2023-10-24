import {Chapter, extractFormInformation, Paragraph, sanitize} from "../../../imports.js";
export class generateChaptersPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
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

    afterRender(){
        if(this.ideas.length !== 0){
            let ideasListContainer = this.element.querySelector(".ideas-list-container");
            ideasListContainer.style.display = "block";
        }
    }

    async generateIdeas(){
        let form = this.element.querySelector(".generate-ideas-form");
        let formInfo = await extractFormInformation(form);
        if(formInfo.isValid) {
            const loading = await webSkel.showLoading();
            let scriptId = webSkel.space.getScriptIdByName("generate ideas");
            let result = await webSkel.getService("LlmsService").callScript(scriptId, formInfo.data.idea);
            this.ideas= result.responseJson;
            loading.close();
            loading.remove();
            this.invalidate();
        }

    }

    async generateChapters(_target){
        const loading = await webSkel.showLoading();
        let formInfo = await extractFormInformation(_target);
        let scriptId = webSkel.space.getScriptIdByName("generate chapters");
        let selectedIdeas = [];
        for (const [key, value] of Object.entries(formInfo.elements)) {
            if(value.element.checked) {
                selectedIdeas.push(value.element.value);
            }
        }
        let result = await webSkel.getService("LlmsService").callScript(scriptId, JSON.stringify(selectedIdeas));
        if(result.responseJson){
            await this._document.addChapters(result.responseJson, selectedIdeas);
        }
        loading.close();
        loading.remove();
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async openMangeChaptersPage() {
        await webSkel.changeToDynamicPage("manage-chapters-page", `documents/${this._document.id}/manage-chapters-page`);
    }
    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

}