const spaceModule=require("assistos").loadModule("space", {});
export class AgentPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        assistOS.space.observeChange(assistOS.space.getNotificationId(),invalidate);
        this.agent={
            conversationHistory: [],
        }
        this.invalidate(async ()=>{
            this.personalities= await assistOS.space.getPersonalitiesMetadata();
        });
        this.private = "selected-chat";
    }

    beforeRender() {
        let stringHTML = "";
        for (let message of assistOS.space.chat) {
            if ( message.role === "user") {
                if(message.user===assistOS.user.id) {
                    stringHTML += `<chat-unit role="own" message="${message.message}" user="${message.user}" data-presenter="chat-unit"></chat-unit>`;
                }else {
                    stringHTML += `<chat-unit role="user" message="${message.message}" user="${message.user}" data-presenter="chat-unit"></chat-unit>`;
                }
            } else if (message.role === "assistant") {
               stringHTML += `<chat-unit role="robot" message="${message.message}" user="${message.user}" data-presenter="chat-unit"></chat-unit>`;
            }
        }
        let personalitiesHTML = "";
        for(let personality of this.personalities){
            personalitiesHTML += `<simple-unit data-local-action="swapPersonality ${personality.id}" data-name="${personality.name}" data-highlight="light-highlight"></simple-unit>`;

        }
        this.personalitiesHTML = personalitiesHTML;
        this.spaceConversation = stringHTML;
        this.currentPersonalityName = "Artist";
        this.personalityLLM = "GPT 3.5";
        this.spaceName = assistOS.space.name;
    }

    resizeTextarea() {
        //this.style.height = 'auto';
        //this.style.height = (this.scrollHeight) + 'px';
    }
    inviteCollaborators(_target){
        assistOS.UI.showModal("add-space-collaborator-modal", {presenter: "add-space-collaborator-modal"});
    }
    afterRender() {
        this.conversation=this.element.querySelector(".conversation");
        this.userInput = this.element.querySelector("#input");
        this.form = this.element.querySelector(".chat-input-container");
        this.boundFn = this.preventRefreshOnEnter.bind(this, this.form);
        this.userInput.addEventListener("keydown", this.boundFn);
  /*      this.rightPanel = document.querySelector(".current-page");
        this.conversation = this.element.querySelector(".conversation");
        this.userInput = this.element.querySelector("#input");
        let form = this.element.querySelector(".chat-input-container");
        this.userInput.removeEventListener("keydown", this.boundFn);
        this.boundFn = this.preventRefreshOnEnter.bind(this, form);
        this.userInput.addEventListener("keydown", this.boundFn);
     /!*   setTimeout(async () => {
            if (this.agent.conversationHistory.length === 0) {
                await assistOS.services.initOpeners();
                let message = this.agent.getRandomOpener();
                await this.displayMessage("assistant", message);
                await this.agent.addMessage("assistant", message);
                await assistOS.services.addCapabilities();
            }
        }, 0);*!/*/

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

    async changeLLM(_target){
       await assistOS.UI.showModal("change-llm-modal");
    }

    async changePersonality(_target, id){
        await assistOS.UI.showModal("change-personality-modal");
    }
    async displayMessage(role, text) {
        const messageHTML = `<chat-unit role="${role}" message="${text}" data-presenter="chat-unit" user="${assistOS.user.id}"></chat-unit>`;
        this.conversation.insertAdjacentHTML("beforeend", messageHTML);
        const lastReplyElement = this.conversation.lastElementChild;

        const isNearBottom = this.conversation.scrollHeight - this.conversation.scrollTop < this.conversation.clientHeight + 100;
        if (isNearBottom) {
            lastReplyElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }


    async preventRefreshOnEnter(form, event) {
        if (event.key === "Enter") {
            event.preventDefault();

            if (!event.ctrlKey) {
                await this.sendMessage(form);
                this.userInput.style.height = "50px";
                form.style.height = "auto";
                this.userInput.scrollIntoView({ behavior: "smooth", block: "end" });
            } else {
                this.userInput.value += '\n';
                this.userInput.style.height = `${this.userInput.scrollHeight}px`;
            }
        }
    }


    async sendMessage(_target) {
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        let userMessage = assistOS.UI.sanitize(assistOS.UI.customTrim(formInfo.data.input));
        formInfo.elements.input.element.value = "";
        if (userMessage === "" || userMessage === null || userMessage === undefined) {
            return;
        }
        await spaceModule.addSpaceChatMessage(assistOS.space.id, userMessage)

        await this.displayMessage("own", userMessage);

        let agentMessage;
        try {
            agentMessage = await assistOS.services.analyzeRequest(formInfo.data.input, this.refreshRightPanel.bind(this));
        }catch (e) {
            console.error(e);
            agentMessage = "I am sorry, something went wrong while analyzing your request. Please try again.";
        }
        await this.displayMessage("assistant", agentMessage);
        await this.agent.addMessage("assistant", agentMessage);
    }

    refreshRightPanel(){
        let parentComponent = assistOS.UI.getClosestParentElement(this.element, "space-configs-page");
        let rightPanel = parentComponent.querySelector(".current-page");
        assistOS.UI.refreshElement(rightPanel);
    }

    async resetConversation() {
        await assistOS.services.resetConversation();
        this.invalidate();
    }
    uploadFile(_target){
        let fileInput = this.element.querySelector(".file-input");
        fileInput.click();
    }
    swapChat(_target, mode){
        const selectedChat = this.element.querySelector(".selected-chat");
        if(mode === selectedChat.getAttribute("id")){
            return;
        }
        switch (mode) {
            case "private":
            {
                this.private = "selected-chat";
                this.shared = "";
                this.chat = "";
                break;
            }
            case "shared":
            {
                this.private = "";
                this.shared = "selected-chat";
                this.chat = "";
                break;
            }
            default:
            {
                this.private = "";
                this.shared = "";
                this.chat = "selected-chat";
                break;
            }
        }
        this.invalidate();
    }

    hidePersonalities(controller, arrow, event) {
        arrow.setAttribute("data-local-action", "showPersonalities off");
        let target = this.element.querySelector(".personalities-list");
        target.style.display = "none";
        controller.abort();
        arrow.classList.add("rotated");
    }

    showPersonalities(_target, mode) {
        if (mode === "off") {
            let list = this.element.querySelector(".personalities-list");
            list.style.display = "flex";
            _target.classList.remove("rotated");
            let controller = new AbortController();
            document.addEventListener("click", this.hidePersonalities.bind(this, controller, _target), {signal: controller.signal});
            _target.setAttribute("data-local-action", "showPersonalities on");
        }
    }

    async swapPersonality(_target, id) {
        console.log("to be done")
    }
}
