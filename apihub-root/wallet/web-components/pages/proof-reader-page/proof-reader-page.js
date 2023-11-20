import {
    extractFormInformation,
    reverseQuerySelector
} from "../../../imports.js";
export class proofReaderPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.text = "";
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
        let textElement = this.element.querySelector("#text");
        textElement.value = this.text;
        if(this.generatedText){
           let aiText = this.element.querySelector(".generated-text-container");
           aiText.style.display = "flex";
        }
        let detailsElement = this.element.querySelector("#details");
        if(this.details){
            detailsElement.value = this.details.prompt;
        }
    }

    async executeProofRead(formElement,cached) {
        const addressLLMRequest = async (formData)=>{
            if(formData){
                this.text = formData.data.text;
                this.personality = webSkel.currentUser.space.getPersonality(formData.data.personality);
                this.details = {prompt:formData.data.details};
            }
            let flowId = webSkel.currentUser.space.getFlowIdByName("proofread");
            let result = await webSkel.getService("LlmsService").callFlow(flowId, this.text, this.personality.id, this.details);
            this.observations = result.responseJson.observations;
            this.generatedText = result.responseJson.improvedText;
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
            if(this.text!==undefined){
                await this.executeProofRead(_target,"cached");
            }
    }
    async copyText(_target){
        let text=reverseQuerySelector(_target,".generated-text")?.innerText;
        if(text){
            await navigator.clipboard.writeText(text);
            text.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Copied!" data-left="${text.innerText.offsetWidth/2}"></confirmation-popup>`);
        }
    }
}