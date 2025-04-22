const llmModule = require("assistos").loadModule("llm", {});
const agentModule= require("assistos").loadModule("agent",{});

export class AgentChat {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.agentPagePresenter = this.element.closest("edit-agent-page").webSkelPresenter;
        this.agent = this.agentPagePresenter.agent;
        this.invalidate();
    }
    async beforeRender(){
        let availableLlms = await llmModule.getModels({spaceId:assistOS.space.id});

        const chatModels = availableLlms.reduce((acc, llm) => {
            if(llm.type === "text"){
                acc.push(llm);
            }
            return acc;
        },[])
        this.chatLLMSection = this.agentPagePresenter.generateLlmSelectHtml(chatModels, "chat");
        this.contextSize = this.agent.contextSize||3;
        const iFrameURL = `${window.location.origin}/iframes/chat?spaceId=${assistOS.space.id}&agentId=${this.agent.id}`
        this.chatIframe = `
                        <iframe 
                            id="chatFrame"
                            src="${iFrameURL}" 
                            allowfullscreen
                            loading="lazy">
                        </iframe>`

        this.chatPrompt = this.agent.chatPrompt;

      let agentChats = await agentModule.getAgentsConversations(assistOS.space.id,assistOS.agent.id)
    debugger
        this.chatOptions = agentChats.map((chatId, index) => {
            return `<option value="${chatId}" ${assistOS.agent.selectedChat === chatId ? "selected" : ""}>${chatId}</option>`;
        });

    }
    afterRender(){
        let saveInputs = ["chatPrompt", "selectedChat", "contextSize"];
        for(let input of saveInputs){
            let inputElement = this.element.querySelector(`#${input}`);
            inputElement.addEventListener("input", (event) => {
                if(input === "contextSize"){
                    this.agent[input] = parseInt(event.target.value || "0");
                } else {
                    this.agent[input] = event.target.value;
                }
                this.agentPagePresenter.checkSaveButtonState();
            });
        }
        let chatSelect = this.element.querySelector(`#chatLLM`);
        chatSelect.addEventListener("change", async (e) => {
            this.agent.llms.chat = e.target.value;
            this.agentPagePresenter.checkSaveButtonState();
        });
    }
}