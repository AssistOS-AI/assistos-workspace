import { proofReaderService } from "../../../core/services/proofReaderService.js";
import { extractFormInformation } from "../../../imports.js";

export class proofReaderPage {
    constructor(element, invalidate) {
        this.element = element;
        this.generatedText = "AI Generated Text";

        //this._document.observeChange(this._paragraph.getNotificationId(this.chapterId), invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        let stringHTML = "";
        for (let llm of webSkel.space.settings.llms) {
            stringHTML += `<option data-llm-name="${llm.name}" data-llm-id="${llm.id}">${llm.name}</option>`;
        }
        this.llmsOptions = stringHTML;
    }

    async executeProofRead(formElement) {
        const formData= await extractFormInformation(formElement);
        if(formData.isValid) {
            const proofReader= new proofReaderService(formData.data.length, formData.data.personality, formData.data.llm, formData.data.language, formData.data.variants, formData.data.prompt);
            let results = await proofReader.proofRead();
            let generatedTextNode = document.querySelector(".generated-content");
            let stringHTML = "";
            for(let subResult of results) {
                stringHTML += `<p>${subResult}</p>`;
            }
            generatedTextNode.innerHTML = stringHTML;
        }
    }
}