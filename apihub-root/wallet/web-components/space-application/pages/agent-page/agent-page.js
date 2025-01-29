const spaceModule = require("assistos").loadModule("space", {});

export class AgentPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        assistOS.space.observeChange(assistOS.space.getNotificationId(), invalidate);
        this.agent = {
            conversationHistory: [],
        }
        this.invalidate(async () => {
            this.boundOnChatUpdate = this.onChatUpdate.bind(this);
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, `chat_${assistOS.agent.agentData.id}`, this.boundOnChatUpdate);
        });
    }

    onChatUpdate() {
        this.invalidate(async () =>this.chat = await spaceModule.getSpaceChat(assistOS.space.id, assistOS.agent.agentData.id));
    }

    async beforeRender() {
        this.chat= await spaceModule.getSpaceChat(assistOS.space.id, assistOS.agent.agentData.id);
        this.personalities= await assistOS.space.getPersonalitiesMetadata();
        let stringHTML = "";
        for (let message of this.chat) {
            let role = "Space";

            if (message.role === "user") {
                if (message.user === assistOS.user.id) {
                    role = "own"
                } else {
                    role = "user"
                }
            } else if (message.role === "assistant") {
                role = "assistant";
            }
            if (role !== "Space") {
                stringHTML += `<chat-item role="${role}" message="${message.message}" user="${message.user}" data-presenter="chat-item"></chat-item>`;
            }
        }
        let personalitiesHTML = "";
        for (let personality of this.personalities) {
            personalitiesHTML += `<list-item data-local-action="swapPersonality ${personality.id}" data-name="${personality.name}" data-highlight="light-highlight"></list-item>`;
        }
        this.personalitiesHTML = personalitiesHTML;
        this.spaceConversation = stringHTML;
        this.currentPersonalityName = assistOS.agent.agentData.name;
        this.personalityLLM = assistOS.agent.agentData.llms.text;
        this.spaceName = assistOS.space.name.length > 15 ? assistOS.space.name.substring(0, 15) + "..." : assistOS.space.name;
    }

    async afterRender() {
        this.conversation = this.element.querySelector(".conversation");
        this.userInput = this.element.querySelector("#input");
        this.form = this.element.querySelector(".chat-input-container");
        this.boundFn = this.preventRefreshOnEnter.bind(this, this.form);
        this.userInput.addEventListener("keydown", this.boundFn);
        await document.querySelector('space-application-page')?.webSkelPresenter?.toggleChat(undefined, assistOS.UI.chatState, assistOS.UI.chatWidth);
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


    async changePersonality(_target, id) {
        await assistOS.UI.showModal("change-personality-modal");
    }

    async displayMessage(role, text) {
        const messageHTML = `<chat-item role="${role}" message="${text}" data-presenter="chat-item" user="${assistOS.user.id}"></chat-item>`;
        this.conversation.insertAdjacentHTML("beforeend", messageHTML);
        const lastReplyElement = this.conversation.lastElementChild;

        const isNearBottom = this.conversation.scrollHeight - this.conversation.scrollTop < this.conversation.clientHeight + 100;
        if (isNearBottom) {
            lastReplyElement.scrollIntoView({behavior: "smooth", block: "nearest"});
        }
    }


    async preventRefreshOnEnter(form, event) {
        if (event.key === "Enter") {
            event.preventDefault();

            if (!event.ctrlKey) {
                await this.sendMessage(form);
                this.userInput.style.height = "50px";
                form.style.height = "auto";
                this.userInput.scrollIntoView({behavior: "smooth", block: "end"});
            } else {
                this.userInput.value += '\n';
                this.userInput.style.height = `${this.userInput.scrollHeight}px`;
            }
        }
    }

    getChatHistory() {
        const chatItems = this.element.querySelectorAll("chat-item");
        const chatHistory = [];
        for (const chatItem of chatItems) {
            let role = chatItem.getAttribute("role");
            if (role === "Space") {
                continue;
            }
            role = role === "own" ? "user" : role;
            if (role !== "undefined") {
                chatHistory.push({role: role, content: chatItem.querySelector(".message").innerText});
            }
        }
        //TODO:Redo quick fix to allow huggingface models to work due to constraint on user/assistant role consecutive requirement in chat structure
        return [chatHistory[0]];
    }

    async sendMessage(_target) {
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        const userRequestMessage = assistOS.UI.customTrim(formInfo.data.input)
        const unsanitizedMessage = assistOS.UI.unsanitize(userRequestMessage);
        formInfo.elements.input.element.value = "";
        if (!userRequestMessage.trim()) {
            return;
        }
        const messageId = (await spaceModule.addSpaceChatMessage(assistOS.space.id,assistOS.agent.agentData.id, unsanitizedMessage)).messageId
        const context = {};
        context.chatHistory = this.getChatHistory();
        await this.displayMessage("own", userRequestMessage);
        const conversationContainer = this.element.querySelector('.conversation');
        await assistOS.agent.processUserRequest(userRequestMessage, context, conversationContainer, messageId);
    }

    refreshRightPanel() {
        let parentComponent = assistOS.UI.getClosestParentElement(this.element, "space-application-page");
        let rightPanel = parentComponent.querySelector(".current-page");
        assistOS.UI.refreshElement(rightPanel);
    }

    async resetConversation() {
        /*await assistOS.services.resetConversation();
        this.invalidate();*/
    }

    uploadFile(_target) {
        let fileInput = this.element.querySelector(".file-input");
        fileInput.click();
    }

    hidePersonalities(controller, arrow, event) {
        arrow.setAttribute("data-local-action", "showPersonalities off");
        let target = this.element.querySelector(".personalities-list");
        target.style.display = "none";
        controller.abort();
    }

    showPersonalities(_target, mode) {
        if (mode === "off") {
            let list = this.element.querySelector(".personalities-list");
            list.style.display = "flex";
            let controller = new AbortController();
            document.addEventListener("click", this.hidePersonalities.bind(this, controller, _target), {signal: controller.signal});
            _target.setAttribute("data-local-action", "showPersonalities on");
        }
    }

    async swapPersonality(_target, id) {
        await assistOS.loadifyFunction(async (id) => {
            await assistOS.changeAgent(id);
            this.invalidate();
        }, id);
    }
}
