const personalityModule = require("assistos").loadModule("personality", {});
const llmModule = require("assistos").loadModule("llm", {});
export class TextMenu{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.parentPresenter = this.element.closest("paragraph-item").webSkelPresenter;
        this.invalidate();
    }
    async beforeRender(){
        this.personalities = await personalityModule.getPersonalities(assistOS.space.id);
        let personalitiesHTML = "";
        let configuredPersonalitiesFound = 0;
        for (let personality of this.personalities) {
            if (personality.text) {
                personalitiesHTML += `<option value="${personality.id}">${personality.name}</option>`;
                configuredPersonalitiesFound++;
            }
        }

        if (configuredPersonalitiesFound === 0) {
            personalitiesHTML += `<option value="default" disabled>No personalities with text LLM</option>`;
        } else if (configuredPersonalitiesFound <= this.personalities.length) {
            personalitiesHTML += `<option value="default" disabled>${this.personalities.length - configuredPersonalitiesFound} personalities unconfigured (text LLM)</option>`;
        }
        this.personalitiesHTML = personalitiesHTML;
    }
    afterRender(){
        let paragraphText = this.element.querySelector('#text');
        paragraphText.innerHTML = this.parentPresenter.paragraph.text;
    }
    async improveText(targetElement){
        let formData = await assistOS.UI.extractFormInformation(targetElement);
        if(!formData.isValid){
            return;
        }
        if(formData.personality){
            let personality = this.personalities.find(personality => personality.id === formData.personality);
        }
        let textResult = await llmModule.generateText({}, assistOS.space.id);
    }
}