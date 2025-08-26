const llmModule = AssistOS.loadModule("llm", {});

export class AgentVideo {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.agentPagePresenter = this.element.closest("edit-agent-page").webSkelPresenter;
        this.agent = this.agentPagePresenter.agent;
        this.invalidate();
    }
    async beforeRender() {
        let availableLlms = await llmModule.listLlms(assistOS.space.id);
        this.videoLLMSection = this.agentPagePresenter.generateLlmSelectHtml(availableLlms["video"], "video");
    }
    async afterRender() {
        let videoSelect = this.element.querySelector(`#videoLLM`);
        videoSelect.addEventListener("change", async (e) => {
            this.agent.llms.video = e.target.value;
            this.agentPagePresenter.checkSaveButtonState();
        });
    }
}