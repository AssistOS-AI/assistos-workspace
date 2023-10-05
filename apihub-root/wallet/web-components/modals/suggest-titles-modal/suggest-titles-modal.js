import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { DocumentModel, extractFormInformation } from "../../../imports.js";

export class suggestTitlesModal {
    constructor(element, invalidate) {
        this.id = window.location.hash.split('/')[1];
        this._document = webSkel.space.getDocument(this.id);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element
        setTimeout(async()=>{
            const loading = await webSkel.showLoading();
            const documentText = this._document.toString();
            //const prompt = `Based on the following document:\n"${documentText}"\n\nPlease suggest 10 original titles that are NOT already present as chapter titles in the document. Return the titles as a string JSON array.`;
            const prompt = this._document.settings.documentTitleScript.content;
            let response = await webSkel.getService("LlmsService").generateResponse(prompt);
            try{
                this.suggestedTitles = JSON.parse(response);
            }catch (e){
                await showApplicationError("Error parsing titles", "Error parsing titles "+ response, e);
                closeModal(this.element);
            }

            loading.close();
            loading.remove();
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
        for(let altTitle of this.suggestedTitles) {
            altTitle = sanitize(altTitle);
            let id = webSkel.getService("UtilsService").generateId();
            stringHTML += `
            <div>
                <label for="${id}">${altTitle}</label>
                <input type="checkbox" id="${id}" name="${altTitle}" data-id="${id}" value="${altTitle}">
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
        await documentFactory.updateDocument(currentSpaceId, this._document);
        this._document.notifyObservers(this._document.getNotificationId());
        closeModal(_target);
    }
}