import { proofReaderService } from "../../../core/services/proofReaderService.js";
import { extractFormInformation } from "../../../imports.js";

export class proofReaderPage {
    constructor(element) {
        this.element = element;
        this.generatedText = "AI Generated Text";
            setTimeout(()=> {
                this.invalidate();
            }, 0);

        this.updateState = ()=> {
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {
        let stringHTML = "";
        for (let llm of webSkel.company.settings.llms) {
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