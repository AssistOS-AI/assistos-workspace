import {
    closeModal,

} from "../../../imports.js";

export class suggestTitlesModal {
    constructor(element, invalidate) {
        this.id = window.location.hash.split('/')[1];
        this._document = webSkel.currentUser.space.getDocument(this.id);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
        this.suggestedTitles = [];
    }

    async generate(_target){
        let formInfo = await webSkel.UtilsService.extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        this.titlesNr = formInfo.data.nr;
        let flowId = webSkel.currentUser.space.getFlowIdByName("SuggestDocumentTitles");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this.prompt, this.titlesNr, "");
        if(result.responseJson){
            this.suggestedTitles = result.responseJson;
            this.invalidate();
        }else {
            webSkel.UtilsService.closeModal(this.element);
            await showApplicationError("Titles invalid format", "", "");
        }
    }
    beforeRender() {
        let stringHTML = "";
        let i = 0;
        for(let altTitle of this.suggestedTitles) {
            i++;
            altTitle = webSkel.UtilsService.sanitize(altTitle);
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
        webSkel.UtilsService.closeModal(_target);
    }

    async addAlternativeTitles(_target){
        let formInfo = await webSkel.UtilsService.extractFormInformation(_target);
        let selectedTitles = [];
        for (const [key, value] of Object.entries(formInfo.elements)) {
            if(value.element.checked) {
                selectedTitles.push({title:webSkel.UtilsService.sanitize(value.element.value)});
            }
        }
        let flowId = webSkel.currentUser.space.getFlowIdByName("AddAlternativeDocumentTitles");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, selectedTitles);
        this._document.notifyObservers(this._document.getNotificationId());
        webSkel.UtilsService.closeModal(_target);
    }
}