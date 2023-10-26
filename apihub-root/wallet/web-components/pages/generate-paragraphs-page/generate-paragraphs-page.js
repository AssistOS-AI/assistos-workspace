import {extractFormInformation} from "../../../imports.js";
export class generateParagraphsPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._chapter = this._document.getChapter(webSkel.space.currentChapterId);
        this.invalidate = invalidate;
        this.invalidate();
        this.ideas = [];
    }

    beforeRender() {
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
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
        this.paragraphsIdeas = stringHMTL;
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
            let scriptId = webSkel.space.getScriptIdByName("generate ideas");
            let result = await webSkel.getService("LlmsService").callScript(scriptId, formInfo.data.idea);
            this.ideas= result.responseJson;
            this.invalidate();
        }

    }

    async generateParagraphs(_target){
        let formInfo = await extractFormInformation(_target);
        let scriptId = webSkel.space.getScriptIdByName("generate paragraphs");
        let selectedIdeas = [];
        for (const [key, value] of Object.entries(formInfo.elements)) {
            if(value.element.checked) {
                selectedIdeas.push(value.element.value);
            }
        }
        let result = await webSkel.getService("LlmsService").callScript(scriptId, JSON.stringify(selectedIdeas));
        if(result.responseJson){
            await this._document.addParagraphs(this._chapter, result.responseJson, selectedIdeas);
        }else {
            showApplicationError("Script execution error",
                "Data received from LLM is an incorrect format", `result from LLM: ${result}`);
        }
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async openChapterBrainstormingPage() {
        await webSkel.changeToDynamicPage("chapter-brainstorming-page", `documents/${this._document.id}/chapter-brainstorming-page/${this._chapter.id}`);
    }
    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

}