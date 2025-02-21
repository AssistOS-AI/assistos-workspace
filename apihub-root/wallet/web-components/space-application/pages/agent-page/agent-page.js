const spaceModule = require("assistos").loadModule("space", {});
const userModule = require("assistos").loadModule("user", {});
const personalityModule = require('assistos').loadModule("personality",{})

export class AgentPage{
    constructor(element,invalidate){
        this.element=element;
        this.invalidate=invalidate;
    }
    async beforeRender(){
        this.personalities = await assistOS.space.getPersonalitiesMetadata();
        let personalitiesHTML = "";
        for (let personality of this.personalities) {
            personalitiesHTML += `<list-item data-local-action="swapPersonality ${personality.id}" data-name="${personality.name}" data-highlight="light-highlight"></list-item>`;
        }
        this.personalitiesHTML = personalitiesHTML;
        this.currentPersonalityName = assistOS.agent.agentData.name;
        let llmName = assistOS.agent.agentData.llms.text;
        let splitLLMName = llmName.split("/");
        if (splitLLMName.length > 1) {
            this.personalityLLM = splitLLMName[1];
        } else {
            this.personalityLLM = llmName;
        }
        this.personalityLLM = this.personalityLLM.length > 17 ? this.personalityLLM.substring(0, 17) + "..." : this.personalityLLM;
        this.spaceName = assistOS.space.name.length > 15 ? assistOS.space.name.substring(0, 15) + "..." : assistOS.space.name;
        this.spaceNameTooltip = assistOS.space.name;
        this.personalityLLMTooltip = llmName;
    }
    async afterRender(){

    }
    async newConversation(target) {
        assistOS.agent.agentData.selectedChat = await personalityModule.createNewConversation(assistOS.space.id, assistOS.agent.agentData.id)
        this.invalidate();
    }
    async resetConversation() {
        await spaceModule.resetSpaceChat(assistOS.space.id, assistOS.agent.agentData.id);
        this.localContext = [];
        this.invalidate();
    }
    async resetLocalContext(target) {
        this.localContext = [];
    }
    async viewAgentContext(_target) {
        await assistOS.UI.showModal('view-context-modal', {presenter: `view-context-modal`});
    }

    hideSettings(controller, container, event) {
        container.setAttribute("data-local-action", "showSettings off");
        let target = this.element.querySelector(".settings-list-container");
        target.style.display = "none";
        controller.abort();
    }
    showSettings(_target, mode) {
        if (mode === "off") {
            let target = this.element.querySelector(".settings-list-container");
            target.style.display = "flex";
            let controller = new AbortController();
            document.addEventListener("click", this.hideSettings.bind(this, controller, _target), {signal: controller.signal});
            _target.setAttribute("data-local-action", "showSettings on");
        }
    }
    async swapPersonality(_target, id) {
        await assistOS.changeAgent(id);
        this.invalidate();
        this.localContext = [];
    }
   async hidePersonalities(controller, arrow, event) {
        arrow.setAttribute("data-local-action", "showPersonalities off");
        let target = this.element.querySelector(".personalities-list");
        target.style.display = "none";
        controller.abort();
    }

    async showPersonalities(_target, mode) {
        if (mode === "off") {
            let list = this.element.querySelector(".personalities-list");
            list.style.display = "flex";
            let controller = new AbortController();
            document.addEventListener("click", this.hidePersonalities.bind(this, controller, _target), {signal: controller.signal});
            _target.setAttribute("data-local-action", "showPersonalities on");
        }
    }
}