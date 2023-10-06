import {extractFormInformation} from "../../../imports.js";

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
            /*evaluate and recreate prompt using personality, language, length*/
            const loading = await webSkel.showLoading();
            this.generatedText = await webSkel.getService("LlmsService").generateResponse(formData.data.prompt);
            loading.close();
            loading.remove();
            this.invalidate();
        }
    }
}