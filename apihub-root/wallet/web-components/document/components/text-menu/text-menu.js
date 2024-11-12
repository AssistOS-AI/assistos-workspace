const personalityModule = require("assistos").loadModule("personality", {});
const documentModule = require("assistos").loadModule("document", {});
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
            if (personality.llms.text) {
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
    async generateText(text){
        let prompt = this.element.querySelector("#prompt").value;
        let personalitySelect = this.element.querySelector("#personality").value;
        let personality;
        if(personalitySelect){
            personality = this.personalities.find(personality => personality.id === personalitySelect);
        }
        let textResult = (await assistOS.callFlow("ImproveText", {
            spaceId: assistOS.space.id,
            personality: personality,
            text: text,
            prompt: prompt
        })).data;
        let resultElement = this.element.querySelector(".generated-text");
        resultElement.innerHTML = textResult.message;
    }
    async improveText(button){
        let buttonText = this.showLoadingResult(button);
        let text = this.element.querySelector("#text").value;
        if(!text){
            alert("Please enter text to improve");
            return;
        }
        try{
            await this.generateText(text);
        } catch (e) {
            button.classList.remove('loading-icon');
            button.innerHTML = buttonText;
            this.element.style.pointerEvents = "initial";
            await showApplicationError("Failed to generate text ", assistOS.UI.sanitize(e.message));
        }


        button.classList.remove('loading-icon');
        button.innerHTML = "Retry";
        this.element.style.pointerEvents = "initial";

        let resultSection = this.element.querySelector(".result-section");
        resultSection.classList.remove("hidden");
        let acceptButton = this.element.querySelector(".accept-text");
        acceptButton.classList.remove("hidden");
        let declineButton = this.element.querySelector(".decline-text");
        declineButton.classList.remove("hidden");
        let retryButton = this.element.querySelector(".retry-text");
        retryButton.classList.remove("hidden");

    }
    showLoadingResult(button){
        this.element.style.pointerEvents = "none";
        button.classList.add('loading-icon');
        let buttonText = button.innerHTML;
        button.innerHTML = '';
        return buttonText;
    }
    async retryWithResult(button){
        let buttonText = this.showLoadingResult(button)
        let resultText = this.element.querySelector(".generated-text");
        try {
            await this.generateText(resultText.value);
        } catch (e) {
            button.classList.remove('loading-icon');
            button.innerHTML = buttonText;
            this.element.style.pointerEvents = "initial";
            await showApplicationError("Failed to generate text ", assistOS.UI.sanitize(e.message));
        }
        button.classList.remove('loading-icon');
        button.innerHTML = buttonText;
        this.element.style.pointerEvents = "initial";
    }
    async acceptText(){
        this.parentPresenter.paragraph.text = this.element.querySelector(".generated-text").value;
        let textElement = this.parentPresenter.element.querySelector(".paragraph-text");
        textElement.innerHTML = this.parentPresenter.paragraph.text;
        await documentModule.updateParagraphText(assistOS.space.id, this.parentPresenter._document.id, this.parentPresenter.paragraph.id, this.parentPresenter.paragraph.text);
        this.closeMenu();
    }
    closeMenu(){
        let menuContainer = this.element.closest(".toolbar-menu");
        document.removeEventListener("click", this.element.boundCloseMenu);
        menuContainer.remove();
    }
}