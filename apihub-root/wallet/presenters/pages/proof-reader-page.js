import {checkValidityFormInfo, extractFormInformation} from "../../../WebSkel/utils/form-utils.js";
import {proofReaderService} from "../../core/services/proofReaderService.js";

export class proofReaderPage {
    constructor(element) {
        this.element=element;
        this.generatedText = "AI Generated Text";
        if(webSkel.company.documents) {
            this._documentConfigs = webSkel.company.documents;
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {
        let stringHTML="";
        for(let llm of webSkel.company.llms){
            stringHTML+=`<option data-llm-name="${llm.name}" data-llm-id="${llm.id}">${llm.name}</option>`;
        }
        this.llmsOptions=stringHTML;
    }

    checkPasswordConfirmation(){
        let password = document.querySelector("#password");
        let confirmPassword = document.querySelector("#confirm-password");
        return password.value === confirmPassword.value;
    }
    async executeProofRead(formElement){
        const conditions={"checkPasswordConfirmation":this.checkPasswordConfirmation}
        const formData= await extractFormInformation(formElement, conditions);
        if(formData.isValid)
        {
            const proofReader= new proofReaderService(formData.data.length,formData.data.personality,formData.data.llm,formData.data.language,formData.data.variants,formData.data.prompt);
            let results= await proofReader.proofRead();
            let generatedTextNode=document.querySelector(".generated-content");
            let stringHTML="";
            for(let subResult of results){
                stringHTML+=`<p>${subResult}</p>`;
            }
            generatedTextNode.innerHTML=stringHTML;
        }
    }
}