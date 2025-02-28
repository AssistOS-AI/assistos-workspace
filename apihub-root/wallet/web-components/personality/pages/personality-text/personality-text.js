const llmModule = require("assistos").loadModule("llm", {});

export class PersonalityText{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.personalityPagePresenter = this.element.closest("edit-personality-page").webSkelPresenter;
        this.personality = this.personalityPagePresenter.personality;
        this.invalidate();
    }
    async beforeRender(){
        let availableLlms = await llmModule.listLlms(assistOS.space.id);
        this.textLLMSection = this.personalityPagePresenter.generateLlmSelectHtml(availableLlms["text"], "text");
    }
    async afterRender(){
        let textSelect = this.element.querySelector(`#textLLM`);
        textSelect.addEventListener("change", async (e) => {
            this.personality.llms.text = e.target.value;
            this.personalityPagePresenter.checkSaveButtonState();
        });
    }
}