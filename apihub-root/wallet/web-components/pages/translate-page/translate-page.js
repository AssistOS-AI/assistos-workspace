import {
    extractFormInformation,
    reverseQuerySelector
} from "../../../imports.js";
export class translatePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.text = "";
    }

    beforeRender() {
        if(!this.personality){
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

        if(this.language){
            let languageElement = this.element.querySelector("#language");
            languageElement.value = this.language;
        }

        if(this.generatedText){
           let aiText = this.element.querySelector(".generated-text-container");
           aiText.style.display = "flex";
        }

        if(this.details){
            let details = this.element.querySelector("#details");
            details.value = this.details;
        }
    }

    async translate(formElement) {
        const formData= await extractFormInformation(formElement);

        this.text = formData.data.text;
        this.language = formData.data.language;
        this.personality = webSkel.currentUser.space.getPersonality(formData.data.personality);
        this.details = formData.data.details;
        let flowId = webSkel.currentUser.space.getFlowIdByName("Translate");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, this.text, formData.data.personality, this.language, this.details);
        this.generatedText = result.responseString;
        this.invalidate();

    }
    async regenerate(_target){
            if(this.text!==undefined){
                await this.translate(this.element.querySelector("form"));
            }
    }
    async copyText(_target){
        let text=reverseQuerySelector(_target,".generated-text")?.innerText;
        if(text){
            await navigator.clipboard.writeText(text);
        }
    }
}