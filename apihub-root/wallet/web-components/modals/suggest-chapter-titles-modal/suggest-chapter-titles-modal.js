import {
    closeModal,
    extractFormInformation,
    sanitize
} from "../../../imports.js";

export class suggestChapterTitlesModal {
    constructor(element, invalidate) {
        this.element = element;
        this.documentId = webSkel.space.currentDocumentId
        this._document = webSkel.space.getDocument(this.documentId);
        this._chapter = this._document.getChapter(window.location.hash.split("/")[3]);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.suggestedTitles = "";
        setTimeout(async()=>{
            let scriptId = webSkel.space.getScriptIdByName("suggest chapter titles");
            let result = await webSkel.getService("LlmsService").callScript(scriptId, this._document.topic);
            if(result.responseJson){
                this.suggestedTitles = result.responseJson;
                this.invalidate();
            }else {
                closeModal(this.element);
            }
        },0);
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
                <input type="checkbox" id="${id}" name="${altTitle}" data-id="${id}" value="${altTitle}">
                
            </div>
            <hr class="suggest-titles-modal-hr">`;
        }
        this.suggestedTitles = stringHTML;
    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addAlternativeTitles(_target){
        let formInfo = await extractFormInformation(_target);
        for (const [key, value] of Object.entries(formInfo.elements)) {
            if(value.element.checked) {
                await this._chapter.addAlternativeTitle({title:sanitize(value.element.value)});
            }
        }
        await documentFactory.updateDocument(currentSpaceId, this._document);
        await this._document.notifyObservers(this._document.getNotificationId());
        closeModal(_target);
    }
}