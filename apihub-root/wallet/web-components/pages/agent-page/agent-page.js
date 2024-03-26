import {
    customTrim,
    extractFormInformation,
    sanitize,
} from "../../../imports.js";

export class AgentPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.agent = system.space.getDefaultAgent();
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
                await system.services.initOpeners();
                let message = this.agent.getRandomOpener();
                await this.displayMessage("assistant", message);
                await this.agent.addMessage("assistant", message);
                await system.services.addCapabilities();
            }
        }, 0);

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
        let formInfo = await extractFormInformation(_target);
        let userPrompt = sanitize(customTrim(formInfo.data.input));
        formInfo.elements.input.element.value = "";
        if (userPrompt === "") {
            return;
        }
        await this.displayMessage("user", userPrompt);
        let response = await system.services.analyzeRequest(formInfo.data.input);
        let agentMessage;
        if (response.refreshRightPanel) {
            agentMessage = response.message;
            let parentComponent = system.UI.getClosestParentElement(this.element, "space-configs-page");
            let rightPanel = parentComponent.querySelector(".current-page");
            system.UI.refreshElement(rightPanel);
        } else {
            agentMessage = response;
        }
        await this.displayMessage("assistant", agentMessage);
        await this.agent.addMessage("assistant", agentMessage);
    }

    async resetConversation() {
        await system.services.resetConversation();
        this.invalidate();
    }
}
