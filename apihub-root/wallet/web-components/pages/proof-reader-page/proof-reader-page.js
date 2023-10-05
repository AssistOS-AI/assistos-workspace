import { proofReaderService } from "../../../core/services/proofReaderService.js";
import { extractFormInformation } from "../../../imports.js";

export class proofReaderPage {
    constructor(element, invalidate) {
        this.element = element;
        this.generatedText = "AI Generated Text";
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
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