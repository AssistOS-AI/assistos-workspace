const spaceModule = require("assistos").loadModule("space", {});
import {NotificationRouter} from "../../../../imports.js";
export class AgentPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        assistOS.space.observeChange(assistOS.space.getNotificationId(), invalidate);
        this.agent = {
            conversationHistory: [],
        }
        this.invalidate(async () => {
            this.personalities = await assistOS.space.getPersonalitiesMetadata();
            this.boundOnChatUpdate = this.onChatUpdate.bind(this);
            await NotificationRouter.subscribeToSpace(assistOS.space.id, `chat_${assistOS.space.id}`, this.boundOnChatUpdate);
        });

        this.private = "selected-chat";
        this.enabledAgents = true;
    }
    onChatUpdate() {
        this.invalidate(async () => assistOS.space.chat = await spaceModule.getSpaceChat(assistOS.space.id, "123456789"));
    }
    async beforeRender() {
        if (this.enabledAgents) {
            this.agentsToggleButton = "Disable Agents"
        } else {
            this.agentsToggleButton = "Enable Agents"
        }
        let stringHTML = "";
        for (let message of assistOS.space.chat) {
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
            stringHTML += `<chat-item role="${role}" message="${message.message}" user="${message.user}" data-presenter="chat-item"></chat-item>`;
        }
        let personalitiesHTML = "";
        for (let personality of this.personalities) {
            personalitiesHTML += `<list-item data-local-action="swapPersonality ${personality.id}" data-name="${personality.name}" data-highlight="light-highlight"></list-item>`;
        }
        this.personalitiesHTML = personalitiesHTML;
        this.spaceConversation = stringHTML;
        this.currentPersonalityName = "Artist";
        this.personalityLLM = "GPT-4o";
        this.spaceName = assistOS.space.name;
    }
    async afterRender() {
        this.conversation = this.element.querySelector(".conversation");
        this.userInput = this.element.querySelector("#input");
        this.form = this.element.querySelector(".chat-input-container");
        this.boundFn = this.preventRefreshOnEnter.bind(this, this.form);
        this.userInput.addEventListener("keydown", this.boundFn);
    }

    async toggleAgentsState(_target) {
        this.enabledAgents = !this.enabledAgents;
        const buttonAgentItem = this.element.querySelector("[data-local-action=toggleAgentsState]");
        if (this.enabledAgents) {
            buttonAgentItem.querySelector('.list-item-name').innerText = "Disable Agents"
        } else {
            buttonAgentItem.querySelector('.list-item-name').innerText = "Enable Agents"
        }
    }

    inviteCollaborators(_target) {
        assistOS.UI.showModal("add-space-collaborator-modal", {presenter: "add-space-collaborator-modal"});
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
                chatHistory.push({role: role, content: chatItem.querySelector("#messageContainer").innerText});
            }
        }
        //TODO:Redo quick fix to allow huggingface models to work due to constraint on user/assistant role consecutive requirement in chat structure
        return [chatHistory[0]];
    }

    async sendMessage(_target) {
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        const userRequestMessage = assistOS.UI.customTrim(formInfo.data.input)
        /* for some reason everything extracted out of a form is automatically sanitized */
        const unsanitizedMessage = assistOS.UI.unsanitize(userRequestMessage);
        formInfo.elements.input.element.value = "";
        if (!userRequestMessage.trim()) {
            return;
        }
        const messageId = (await spaceModule.addSpaceChatMessage(assistOS.space.id, unsanitizedMessage)).messageId
        const context = {};
        context.chatHistory = this.getChatHistory();
        await this.displayMessage("own", userRequestMessage);
        const conversationContainer = this.element.querySelector('.conversation');
        if (this.enabledAgents) {
            try {
                await assistOS.agent.processUserRequest(userRequestMessage, context, conversationContainer, messageId);
            } catch (error) {
                console.error('Failed to find element:', error);
            }
        }
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

    swapChat(_target, mode) {
        const selectedChat = this.element.querySelector(".selected-chat");
        if (mode === selectedChat.getAttribute("id")) {
            return;
        }
        switch (mode) {
            case "private": {
                this.private = "selected-chat";
                this.shared = "";
                this.chat = "";
                break;
            }
            case "shared": {
                this.private = "";
                this.shared = "selected-chat";
                this.chat = "";
                break;
            }
            default: {
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
