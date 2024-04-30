export class AgentPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        assistOS.space.observeChange(assistOS.space.getNotificationId(),invalidate);
        //this.agent = assistOS.space.getAgent();
        this.agent={
            conversationHistory: [],
        }
        this.invalidate();
    }

    beforeRender() {
        let stringHTML = "";
        for (let reply of this.agent.conversationHistory) {
            if (reply.role === "user") {
                stringHTML += `
                <div class="chat-box-container user">
                 <div class="chat-box user-box">${reply.content}</div>
                </div>`;
            } else if (reply.role === "assistant") {
                stringHTML += `
                <div class="chat-box-container robot">
                 <div class="chat-box robot-box">${reply.content}</div>
                </div>`;
            }
        }
        this.conversationHistory = stringHTML;
    }

    resizeTextarea() {
        //this.style.height = 'auto';
        //this.style.height = (this.scrollHeight) + 'px';
    }

    afterRender() {
        this.rightPanel = document.querySelector(".current-page");
        this.conversation = this.element.querySelector(".conversation");
        this.userInput = this.element.querySelector("#input");
        let form = this.element.querySelector(".chat-input-container");
        this.userInput.removeEventListener("keydown", this.boundFn);
        this.boundFn = this.preventRefreshOnEnter.bind(this, form);
        this.userInput.addEventListener("keydown", this.boundFn);
        setTimeout(async () => {
            if (this.agent.conversationHistory.length === 0) {
                await assistOS.services.initOpeners();
                let message = this.agent.getRandomOpener();
                await this.displayMessage("assistant", message);
                await this.agent.addMessage("assistant", message);
                await assistOS.services.addCapabilities();
            }
        }, 0);

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
        let reply;
        if (role === "user") {
            reply = `
                <div class="chat-box-container user">
                 <div class="chat-box user-box">${text}</div>
                </div>`;

        } else if (role === "assistant") {
            reply = `
                <div class="chat-box-container robot">
                 <div class="chat-box robot-box">${text}</div>
                </div>`;
        }
        this.conversation.insertAdjacentHTML("beforeend", reply);
        const lastReplyElement = this.conversation.lastElementChild;
        lastReplyElement.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
    }

    preventRefreshOnEnter(form, event) {
        event.target.style.height = (event.target.scrollHeight) + 'px';
        form.style.height = (form.scrollHeight) + 'px';
        if (event.key === "Enter" && !event.ctrlKey) {
            event.preventDefault();
            event.target.style.height = "52px";
            form.style.height = "10%";
            this.element.querySelector(".send-message-btn").click();
        }
        if (event.key === "Enter" && event.ctrlKey) {
            this.userInput.value += '\n';
        }
    }

    async sendMessage(_target) {
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        let userPrompt = assistOS.UI.sanitize(assistOS.UI.customTrim(formInfo.data.input));
        formInfo.elements.input.element.value = "";
        if (userPrompt === "" || userPrompt === null || userPrompt === undefined) {
            return;
        }
        await this.displayMessage("user", userPrompt);
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
}
