import {extractFormInformation, parseURL, sanitize, showModal} from "../../../imports.js";
export class generateParagraphsPage {
    constructor(element, invalidate) {
        this.element = element;
        let documentId, chapterId;
        [documentId, chapterId] = parseURL();
        this._document = webSkel.currentUser.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
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
            if(i === this.ideas.length){
                stringHMTL+=`<div class="generated-idea" data-id="${i}">
                <div class="idea-container">
                  <span class="alt-title-span">${i}.</span>
                  <label for="${i}" class="alt-title-label">${idea}</label>
                </div>
                <input type="checkbox" id="${i}" name="${idea}" value="${idea}" data-condition="verifyCheckedIdeas">
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
        this.paragraphsIdeas = stringHMTL;
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
            let result = await webSkel.getService("GlobalFlowsService").documentFlows.generateIdeas(formInfo.data.idea, "", formInfo.data.nr, "");
            this.ideas= result.responseJson;
            this.invalidate();
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
    async generateParagraphs(_target){
        const conditions = {"verifyCheckedIdeas": {fn:this.verifyCheckedIdeas, errorMessage:"Select at least one idea!"} };
        let formInfo = await extractFormInformation(_target, conditions);
        if(formInfo.isValid){
            let selectedIdeas = [];
            for (const [key, value] of Object.entries(formInfo.elements)) {
                if(value.element.checked) {
                    selectedIdeas.push(value.element.value);
                }
            }
            let flowId = webSkel.currentUser.space.getFlowIdByName("generate paragraphs");
            let result = await webSkel.getService("LlmsService").callFlow(flowId, selectedIdeas, this._document.id, this._chapter.id,formInfo.data.prompt, selectedIdeas.length);
            if(result){
                await webSkel.changeToDynamicPage("manage-paragraphs-page",`documents/${this._document.id}/manage-paragraphs-page/${this._chapter.id}`);
            }
        }
    }

    async openChapterBrainstormingPage() {
        await webSkel.changeToDynamicPage("chapter-brainstorming-page", `documents/${this._document.id}/chapter-brainstorming-page/${this._chapter.id}`);
    }
    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

}