const personalityModule = require("assistos").loadModule("personality", {});
const llmModule = require("assistos").loadModule("llm", {});

export class PersonalityChat{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.personalityPagePresenter = this.element.closest("edit-personality-page").webSkelPresenter;
        this.personality = this.personalityPagePresenter.personality;
        this.invalidate();
    }
    async beforeRender(){
        let availableLlms = await llmModule.listLlms(assistOS.space.id);
        this.chatLLMSection = this.personalityPagePresenter.generateLlmSelectHtml(availableLlms["chat"], "chat");

        this.contextSize = this.personality.contextSize||3;
        const iFrameURL = `${window.location.origin}/chat?spaceId=${assistOS.space.id}&personalityId=${this.personality.id}`
        this.chatIframe = `
                        <iframe 
                            id="chatFrame"
                            src="${iFrameURL}" 
                            allowfullscreen
                            loading="lazy">
                        </iframe>`

        this.chatPrompt = this.personality.chatPrompt;

        let personalityChats = await personalityModule.getPersonalitiesConversations(assistOS.space.id,assistOS.agent.agentData.id)

        this.chatOptions = personalityChats.map((chatId, index) => {
            return `<option value="${chatId}" ${assistOS.agent.agentData.selectedChat === chatId ? "selected" : ""}>${chatId}</option>`;
        });

    }
    afterRender(){
        let saveInputs = ["chatPrompt", "selectedChat", "contextSize"];
        for(let input of saveInputs){
            let inputElement = this.element.querySelector(`#${input}`);
            inputElement.addEventListener("input", (event) => {
                if(input === "contextSize"){
                    this.personality[input] = parseInt(event.target.value || "0");
                } else {
                    this.personality[input] = event.target.value;
                }
                this.personalityPagePresenter.checkSaveButtonState();
            });
        }
        let chatSelect = this.element.querySelector(`#chatLLM`);
        chatSelect.addEventListener("change", async (e) => {
            this.personality.llms.chat = e.target.value;
            this.personalityPagePresenter.checkSaveButtonState();
        });
    }
}