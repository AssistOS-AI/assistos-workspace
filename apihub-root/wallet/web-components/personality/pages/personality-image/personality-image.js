const llmModule = require("assistos").loadModule("llm", {});

export class PersonalityImage{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.personalityPagePresenter = this.element.closest("edit-personality-page").webSkelPresenter;
        this.personality = this.personalityPagePresenter.personality;
        this.invalidate();
    }
    async beforeRender(){
        let availableLlms = await llmModule.listLlms(assistOS.space.id);
        this.imageLLMSection = this.personalityPagePresenter.generateLlmSelectHtml(availableLlms["image"], "image");
    }
    async afterRender(){
        let imageSelect = this.element.querySelector(`#imageLLM`);
        imageSelect.addEventListener("change", async (e) => {
            this.personality.llms.image = e.target.value;
            this.personalityPagePresenter.checkSaveButtonState();
        });
    }
}