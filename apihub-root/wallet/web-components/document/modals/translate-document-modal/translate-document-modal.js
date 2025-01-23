const llmModule = require("assistos").loadModule("llm", {});
const personalityModule = require("assistos").loadModule("personality", {});
const documentModule = require("assistos").loadModule("document", {});
export class TranslateDocumentModal{
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.element = element;
        this.documentId = this.element.getAttribute("data-id");
        this.invalidate(async ()=>{
            this.personalities = await personalityModule.getPersonalities(assistOS.space.id);
        });
    }
    beforeRender() {
        let personalitiesHTML = "";
        for (let personality of this.personalities) {
            personalitiesHTML += `<option value="${personality.id}">${personality.name}</option>`;
        }
        this.personalitiesOptions = personalitiesHTML;
    }
    afterRender(){
        let personalitySelect = this.element.querySelector("#personality");
        let audioLanguages;
        personalitySelect.addEventListener("change", async (e)=>{
            let value = e.target.value;
            let languageSelect = this.element.querySelector("#language");
            languageSelect.innerHTML = "";
            if(value !== ""){
                languageSelect.removeAttribute("disabled");
                let personality = this.personalities.find((p)=> p.id === value);
                let textLanguages = await llmModule.getModelLanguages(assistOS.space.id, personality.llms["text"]);
                if(textLanguages.length === 0){
                    languageSelect.innerHTML = `<option value="" disabled selected>No languages available</option>`;
                    languageSelect.setAttribute("disabled", "true");
                    return;
                }
                for(let language of textLanguages){
                    languageSelect.innerHTML += `<option value="${language}">${language}</option>`;
                }
            }
        });

    }

    async translateDocument(targetElement){
        let formData = await assistOS.UI.extractFormInformation(targetElement);
        if(formData.isValid){
            let taskId = await documentModule.translateDocument(assistOS.space.id, this.documentId, formData.data.language, formData.data.personality);
            assistOS.UI.closeModal(this.element);
        }
    }
    closeModal(){
       assistOS.UI.closeModal(this.element);
    }
}