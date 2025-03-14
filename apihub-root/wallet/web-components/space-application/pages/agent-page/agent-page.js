export class AgentPage{
    constructor(element,invalidate){
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }
    async beforeRender(){
        const chatId = assistOS.agent.agentData.selectedChat||assistOS.agent.agentData.chats[assistOS.agent.agentData.chats.length-1];
        this.chatPage =`<chat-page data-chatId="${chatId}" data-personalityId="${assistOS.agent.agentData.id}" data-spaceId="${assistOS.space.id}" data-userId="${assistOS.user.id}" data-presenter="chat-page" tabindex="0"></chat-page>`
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

    async afterRender(){}

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