import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import {extractFormInformation, sanitize} from "../../../imports.js";

export class suggestTitlesModal {
    constructor(element, invalidate) {
        this.id = window.location.hash.split('/')[1];
        this._document = webSkel.space.getDocument(this.id);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;

        setTimeout(async()=>{
            const loading = await webSkel.showLoading();
            let scriptId = webSkel.space.getScriptIdByName("suggest document titles");
            let result = await webSkel.getService("LlmsService").callScript(scriptId, this._document.topic);
            if(result.responseJson){
                this.suggestedTitles = result.responseJson;
                this.invalidate();
            }else {
                closeModal(this.element);
            }
            loading.close();
            loading.remove();

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
               await this._document.addAlternativeTitle({name:sanitize(value.element.value), id:value.element.getAttribute("data-id")});
            }
        }
        this._document.notifyObservers(this._document.getNotificationId());
        closeModal(_target);
    }
}