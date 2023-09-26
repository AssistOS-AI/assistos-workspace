import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { DocumentModel, extractFormInformation } from "../../../imports.js";

export class suggestTitlesModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
        this.id = parseInt(window.location.hash.split('/')[1]);
        this._document = webSkel.space.getDocument(this.id);
        this._document.observeChange(this._document.getNotifyId(), this.updateState);
        this.suggestedTitles = document.querySelector("edit-title-page").webSkelPresenter.suggestedTitles;
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
        for(let altTitle of this.suggestedTitles) {
            altTitle = sanitize(altTitle);
            stringHTML += `
            <div>
                <label for="${altTitle}">${altTitle}</label>
                <input type="checkbox" id="${altTitle}" name="${altTitle}" data-id="${altTitle}" value="${altTitle}">
            </div>`;
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
                this._document.addAlternativeTitle(value.element.value);
            }
        }
        await storageManager.storeObject("FileSystemStorage", currentSpaceId, "documents", this._document.id, this._document.stringifyDocument());
        this._document.notifyObservers(this._document.getNotifyId());
        closeModal(_target);
    }
}