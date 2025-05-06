export class AgentItem {
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.id = this.element.getAttribute('data-id');
        let agentsPage = this.element.closest("agents-page");
        this.agent = agentsPage.webSkelPresenter.agents.find(agent => agent.id === this.id);
        this.invalidate();
    }
    beforeRender(){
        this.description = this.agent.description;
        this.agentColor = this.agent.info?.color;
    }
    afterRender(){
    }
}