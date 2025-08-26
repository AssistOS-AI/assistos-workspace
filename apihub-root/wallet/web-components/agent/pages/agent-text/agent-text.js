const llmModule = AssistOS.loadModule("llm", {});

export class AgentText {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.agentPagePresenter = this.element.closest("edit-agent-page").webSkelPresenter;
        this.agent = this.agentPagePresenter.agent;
        this.invalidate();
    }
    async beforeRender() {
        let availableLlms = await llmModule.getModels({ spaceId: assistOS.space.id });
        const textLlms = availableLlms.reduce((acc, val) => {

            if (val.type === "text") {
                acc.push(val);
            }
            return acc;
        }, [])

        this.textLLMSection = this.agentPagePresenter.generateLlmSelectHtml(textLlms, "text");
    }
    async afterRender() {
        let textSelect = this.element.querySelector(`#textLLM`);
        textSelect.addEventListener("change", async (e) => {
            this.agent.llms.text = e.target.value;
            this.agentPagePresenter.checkSaveButtonState();
        });
    }
}