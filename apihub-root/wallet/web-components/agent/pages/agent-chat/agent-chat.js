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
            if(llm.type === "chat"){
                acc.push(llm);
            }
            return acc;
        },[])
        this.chatLLMSection = this.agentPagePresenter.generateLlmSelectHtml(chatModels, "chat");
        this.contextSize = this.agent.contextSize||3;
        const iFrameURL = `${window.location.origin}/iframes/chat?spaceId=${assistOS.space.id}&agentId=${this.agent.id}`
        // this.chatIframe = `
        //                 <iframe
        //                     id="chatFrame"
        //                     src="${iFrameURL}"
        //                     allowfullscreen
        //                     loading="lazy">
        //                 </iframe>`

        this.chatPrompt = this.agent.chatPrompt;

    }
    afterRender(){
        let saveInputs = ["chatPrompt", "contextSize"];
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
            let optionId = e.target.value;
            let option = e.target.querySelector(`option[value="${optionId}"]`);
            let modelName = option.getAttribute("data-model");
            let providerName = option.getAttribute("data-provider");
            this.agent.llms.chat = {
                modelName: modelName,
                providerName: providerName
            };
            this.agentPagePresenter.checkSaveButtonState();
        });
    }
}