import {
    closeModal,
    extractFormInformation,
    sanitize
} from "../../../imports.js";

export class suggestChapterTitlesModal {
    constructor(element, invalidate) {
        this.element = element;
        this.documentId = webSkel.currentUser.space.currentDocumentId
        this._document = webSkel.currentUser.space.getDocument(this.documentId);
        this._chapter = this._document.getChapter(window.location.hash.split("/")[3]);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.suggestedTitles = "";
        this.invalidate();
    }
    beforeRender() {
        let stringHTML = "";
        let i = 0;
        for(let altTitle of this.suggestedTitles) {
            i++;
            altTitle = sanitize(altTitle);
            let id = webSkel.getService("UtilsService").generateId();
            stringHTML += `
            <div class="alt-title-row">
                <span class="alt-title-span">${i}.</span>
                <label for="${id}" class="alt-title-label">${altTitle}</label>
                <input type="checkbox" id="${id}" name="${i+altTitle}" data-id="${id}" value="${altTitle}">
                
            </div>
            <hr class="suggest-titles-modal-hr">`;
        }
        this.suggestedTitles = stringHTML;
    }
    afterRender(){
        this.suggestedTitlesForm = this.element.querySelector(".suggested-titles-form");
        if(!this.suggestedTitles){
            this.suggestedTitlesForm.style.display = "none";
        }
        let textBox = this.element.querySelector("#prompt");
        if(this.prompt){
            textBox.value = this.prompt;
        }
        let inputNr = this.element.querySelector("#nr");
        if(this.titlesNr){
            inputNr.value = this.titlesNr;
        }
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async generate(_target){
        let formInfo = await extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        this.titlesNr = formInfo.data.nr;
        let flowId = webSkel.currentUser.space.getFlowIdByName("SuggestChapterTitles");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, this.prompt, this.titlesNr, "");
        if(result.responseJson){
            this.suggestedTitles = result.responseJson;
            this.invalidate();
        }else {
            closeModal(this.element);
            await showApplicationError("Titles invalid format", "", "");
        }
    }
    async addAlternativeTitles(_target){
        let formInfo = await extractFormInformation(_target);
        let selectedTitles = [];
        for (const [key, value] of Object.entries(formInfo.elements)) {
            if(value.element.checked) {
                selectedTitles.push({title:sanitize(value.element.value)});
            }
        }
        let flowId = webSkel.currentUser.space.getFlowIdByName("AddAlternativeChapterTitles");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, selectedTitles);
        await this._document.notifyObservers(this._document.getNotificationId());
        closeModal(_target);
    }
}