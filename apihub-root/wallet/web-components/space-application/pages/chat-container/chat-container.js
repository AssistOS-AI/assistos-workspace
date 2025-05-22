const agentModule = require("assistos").loadModule("agent", {});
export class ChatContainer {
    constructor(element,invalidate){
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }
    async beforeRender(){
        // const chatId = assistOS.agent.agentData.selectedChat||assistOS.agent.agentData.chats[0];
        // this.chatPage =`<chat-page data-chatId="${chatId}" data-agentId="${assistOS.agent.agentData.id}" data-spaceId="${assistOS.space.id}" data-userId="${assistOS.user.email}" data-presenter="chat-page" tabindex="0"></chat-page>`
        // this.agents = await agentModule.getAgents(assistOS.space.id)
        // let agentsHTML = "";
        // for (let agent of this.agents) {
        //     agentsHTML += `<list-item data-local-action="swapAgent ${agent.id}" data-name="${agent.name}" data-highlight="light-highlight"></list-item>`;
        // }
        // this.agentsHTML = agentsHTML;
        // this.currentAgentName = assistOS.agent.agentData.name;
        // let llmName = assistOS.agent.agentData.llms.text;
        // let splitLLMName = llmName.split("/");
        // if (splitLLMName.length > 1) {
        //     this.agentLLM = splitLLMName[1];
        // } else {
        //     this.agentLLM = llmName;
        // }
        // this.agentLLM = this.agentLLM.length > 17 ? this.agentLLM.substring(0, 17) + "..." : this.agentLLM;
        // this.spaceName = assistOS.space.name.length > 15 ? assistOS.space.name.substring(0, 15) + "..." : assistOS.space.name;
        // this.spaceNameTooltip = assistOS.space.name;
        // this.agentLLMTooltip = llmName;
    }

    async afterRender(){}

    async swapAgent(_target, id) {
        await assistOS.changeAgent(id);
        this.invalidate();
        this.localContext = [];
    }

   async hideAgents(controller, arrow, event) {
        arrow.setAttribute("data-local-action", "showAgents off");
        let target = this.element.querySelector(".agents-list");
        target.style.display = "none";
        controller.abort();
    }

    async showAgents(_target, mode) {
        if (mode === "off") {
            let list = this.element.querySelector(".agents-list");
            list.style.display = "flex";
            let controller = new AbortController();
            document.addEventListener("click", this.hideAgents.bind(this, controller, _target), {signal: controller.signal});
            _target.setAttribute("data-local-action", "showAgents on");
        }
    }
}