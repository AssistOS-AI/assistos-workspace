import {
    extractFormInformation,
    reverseQuerySelector
} from "../../../imports.js";
export class translatePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.prompt = "";
    }

    beforeRender() {
        if(!this.selectedPersonality){
            this.selectedPersonality = `<option value="" disabled selected hidden>Select personality</option>`;
        }else {
            this.selectedPersonality = `<option value="${this.personality.id}" selected>${this.personality.name}</option>`
        }
        let stringHTML = "";
        for(let personality of webSkel.currentUser.space.personalities){
            stringHTML+=`<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
    }

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
        let promptElement = this.element.querySelector("#prompt");
        promptElement.value = this.prompt;

        if(this.language){
            let languageElement = this.element.querySelector("#language");
            languageElement.value = this.language;
        }

        if(this.generatedText){
           let aiText = this.element.querySelector(".generated-text-container");
           aiText.style.display = "flex";
        }
    }

    async executeProofRead(formElement,cached) {
        const addressLLMRequest = async (formData)=>{
            if(formData){
                this.prompt = formData.data.prompt;
                this.language = formData.data.language;
                this.personality = webSkel.currentUser.space.getPersonality(formData.data.personality);
            }
            let flowId = webSkel.currentUser.space.getFlowIdByName("translate");
            let result = await webSkel.getService("LlmsService").callFlow(flowId, this.prompt, this.personality.name, this.personality.description, this.language);
            this.generatedText = result.responseString;
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