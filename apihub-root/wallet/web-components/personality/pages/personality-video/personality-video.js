const llmModule = require("assistos").loadModule("llm", {});

export class PersonalityVideo{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.personalityPagePresenter = this.element.closest("edit-personality-page").webSkelPresenter;
        this.personality = this.personalityPagePresenter.personality;
        this.invalidate();
    }
    async beforeRender(){
        let availableLlms = await llmModule.listLlms(assistOS.space.id);
        this.videoLLMSection = this.personalityPagePresenter.generateLlmSelectHtml(availableLlms["video"], "video");
    }
    async afterRender(){
        let videoSelect = this.element.querySelector(`#videoLLM`);
        videoSelect.addEventListener("change", async (e) => {
            this.personality.llms.video = e.target.value;
            this.personalityPagePresenter.checkSaveButtonState();
        });
    }
}