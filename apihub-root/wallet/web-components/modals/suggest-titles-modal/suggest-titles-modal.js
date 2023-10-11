import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../imports.js";

export class suggestTitlesModal {
    constructor(element, invalidate) {
        this.id = window.location.hash.split('/')[1];
        this._document = webSkel.space.getDocument(this.id);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;

        setTimeout(async()=>{
            // const loading = await webSkel.showLoading();
            // let result = await webSkel.getService("LlmsService").callScript(this._document.settings.documentTitleScriptId);
            // this.suggestedTitles = result.responseJson;
            // loading.close();
            // loading.remove();
            this.suggestedTitles = ["aa","aaaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaaaaaaaaaaaaaaaaaa","aaaaaaaaaa" ,"asdasdasd", "asdasdasd", "asdasdasd", "adsdasd"]
            this.invalidate();
        },0);
    }

    beforeRender() {
        function sanitize(str) {
            return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/\s/g, '&nbsp;');
        }



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
                this._document.addAlternativeTitle({name:value.element.value, id:value.element.getAttribute("data-id")});
            }
        }
        await documentFactory.updateDocument(currentSpaceId, this._document);
        this._document.notifyObservers(this._document.getNotificationId());
        closeModal(_target);
    }
}