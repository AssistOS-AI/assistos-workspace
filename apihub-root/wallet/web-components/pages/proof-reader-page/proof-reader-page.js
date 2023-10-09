import {extractFormInformation} from "../../../imports.js";
import {reverseQuerySelector} from "../../../../WebSkel/utils/dom-utils.js";

export class proofReaderPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {}

    afterRender(){
        if(this.generatedText!==undefined){
            let refreshButton=this.element.querySelector("#refresh-button");
            let copyButton=this.element.querySelector("#copy-button");
            try{
                refreshButton.style.display="block";
                copyButton.style.display="block";
            }catch(e){
                console.error("Error trying to change the display of the buttons"+e);
            }
        }
    }

    async executeProofRead(formElement,cached) {
        const addressLLMRequest = async (formData)=>{
            const loading = await webSkel.showLoading();
            if(formData){
                this.prompt=formData.data.prompt;
            }
            this.generatedText = await webSkel.getService("LlmsService").generateResponse(this.prompt);
            loading.close();
            loading.remove();
            this.invalidate();
        }
        if(cached){
            await addressLLMRequest();
            return;
        }
        const formData= await extractFormInformation(formElement);
        if(formData.isValid) {
            await addressLLMRequest(formData);
        }
    }
    /* To be Refactored with Session Storage or something better in the future if necessary */
    async regenerate(_target){
            if(this.prompt!==undefined){
                await this.executeProofRead(_target,"cached");
            }
    }
    async copyText(_target){
        let text=reverseQuerySelector(_target,".generated-text")?.innerText;
        if(text){
            await navigator.clipboard.writeText(text);
        }
    }
}