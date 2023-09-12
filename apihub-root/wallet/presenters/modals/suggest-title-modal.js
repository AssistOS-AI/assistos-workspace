import { closeModal } from "../../../WebSkel/utils/modal-utils.js";
import { brainstormingService, extractFormInformation } from "../../imports.js";
import { documentService } from "../../imports.js";

export class suggestTitleModal {
    constructor() {
        if(webSkel.company.documents) {
            this._documentConfigs = webSkel.company.documents;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
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
        const docService = new documentService();
        let currentDocument = docService.getDocument(webSkel.company.currentDocumentId);
        for (const [key, value] of Object.entries(formInfo.elements)) {
            if(value.element.checked) {
                currentDocument.alternativeTitles.push(value.element.value);
            }
        }
        await docService.updateDocument(currentDocument, currentDocument.id);
    }
}