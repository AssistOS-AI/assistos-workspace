const personalityModule = require("assistos").loadModule("personality", {});
const documentModule = require("assistos").loadModule("document", {});
import pluginUtils from "../../../../core/plugins/pluginUtils.js";
export class TextMenu{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        let context = pluginUtils.getContext(this.element);
        if(context.paragraphId){
            this.paragraphPresenter = this.documentPresenter.element.querySelector(`paragraph-item[data-paragraph-id="${context.paragraphId}"]`).webSkelPresenter;
            this.text = this.paragraphPresenter.paragraph.text;
        } else {
            this.text = this.documentPresenter._document.abstract;
        }

        this.element.classList.add("maintain-focus");
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
        paragraphText.innerHTML = this.text;
    }
    async generateText(text){
        let prompt = this.element.querySelector("#prompt").value;
        let personalityId = this.element.querySelector("#personality").value;
        let textResult = (await assistOS.callFlow("ImproveText", {
            spaceId: assistOS.space.id,
            text: text,
            prompt: prompt
        }, personalityId)).data;
        let resultElement = this.element.querySelector(".generated-text");
        resultElement.innerHTML = textResult;
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
        button.innerHTML = buttonText;
        this.element.style.pointerEvents = "initial";
        button.classList.add('hidden');
        let retryButton = this.element.querySelector(".retry-text");
        retryButton.classList.remove('hidden');

        let resultSection = this.element.querySelector(".result-section");
        resultSection.classList.remove("hidden");
        let acceptButton = this.element.querySelector(".accept-text");
        acceptButton.classList.remove("hidden");
        let declineButton = this.element.querySelector(".decline-text");
        if(declineButton){
            declineButton.classList.remove("hidden");
        }
    }
    showLoadingResult(button){
        this.element.style.pointerEvents = "none";
        button.classList.add('loading-icon');
        let buttonText = button.innerHTML;
        button.innerHTML = '';
        return buttonText;
    }
    async retry(button){
        let buttonText = this.showLoadingResult(button)
        let text = this.element.querySelector("#text").value;
        if(!text){
            alert("Please enter text to improve");
            return;
        }
        try {
            await this.generateText(text.value);
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
        let newText = this.element.querySelector(".generated-text").value;
        if(this.paragraphPresenter){
            let textElement = this.paragraphPresenter.element.querySelector(".paragraph-text");
            requestAnimationFrame(() => {
                textElement.innerHTML = newText;
                textElement.style.height = textElement.scrollHeight + "px";
            });
            this.paragraphPresenter.paragraph.text = newText;
            await documentModule.updateParagraphText(assistOS.space.id, this.paragraphPresenter._document.id, this.paragraphPresenter.paragraph.id, this.paragraphPresenter.paragraph.text);
        } else {
            this.documentPresenter._document.abstract = newText;
            let abstractElement = this.documentPresenter.element.querySelector(".document-abstract");
            requestAnimationFrame(() => {
                abstractElement.innerHTML = newText;
                abstractElement.style.height = abstractElement.scrollHeight + "px";
            });
            await documentModule.updateDocumentAbstract(assistOS.space.id, this.documentPresenter._document.id, newText);
        }
        this.closeModal();
    }
    closeModal(button){
        assistOS.UI.closeModal(this.element);
    }
}