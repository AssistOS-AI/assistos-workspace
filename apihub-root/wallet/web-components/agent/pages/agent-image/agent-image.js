const llmModule = require("assistos").loadModule("llm", {});

export class AgentImage {
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.agentPagePresenter = this.element.closest("edit-agent-page").webSkelPresenter;
        this.agent = this.agentPagePresenter.agent;
        this.invalidate();
    }
    async beforeRender(){
        let availableLlms = await llmModule.listLlms(assistOS.space.id);
        this.imageLLMSection = this.agentPagePresenter.generateLlmSelectHtml(availableLlms["image"], "image");
    }
    async afterRender(){
        let imageSelect = this.element.querySelector(`#imageLLM`);
        imageSelect.addEventListener("change", async (e) => {
            this.agent.llms.image = e.target.value;
            this.agentPagePresenter.checkSaveButtonState();
        });
    }
}