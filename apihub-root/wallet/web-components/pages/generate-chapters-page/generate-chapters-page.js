import {extractFormInformation} from "../../../imports.js";

export class generateChaptersPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this.invalidate = invalidate;
        this.invalidate();
        this.ideas = ["Bees are nature's little pollination superheroes!  Let's protect them and ensure our food chain thrives.  #SaveTheBees,Bees are nature's little pollination superheroes!  Let's protect them and ensure our food chain thrives.  #SaveTheBees",
            "Bees are nature's little pollination superheroes!  Let's protect them and ensure our food chain thrives.  #SaveTheBees,Bees are nature's little pollination superheroes!  Let's protect them and ensure our food chain thrives.  #SaveTheBees",
        "Bees are nature's little pollination superheroes!  Let's protect them and ensure our food chain thrives.  #SaveTheBees,Bees are nature's little pollination superheroes!  Let's protect them and ensure our food chain thrives.  #SaveTheBees",
        "Bees are nature's little pollination superheroes!  Let's protect them and ensure our food chain thrives.  #SaveTheBees,Bees are nature's little pollination superheroes!  Let's protect them and ensure our food chain thrives.  #SaveTheBees"];
    }

    beforeRender() {
      let stringHMTL = "";
        let i = 0;
        for(let idea of this.ideas){
          i++;
          stringHMTL+=`<div class="generated-idea">
                <span class="alt-title-span">${i}.</span>
                <label for="${i}" class="alt-title-label">${idea}</label>
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
    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

}