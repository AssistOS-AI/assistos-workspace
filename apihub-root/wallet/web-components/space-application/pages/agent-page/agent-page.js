const spaceModule = require("assistos").loadModule("space", {});

export class AgentPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;

        assistOS.space.observeChange(assistOS.space.getNotificationId(), invalidate);
        const agentState = localStorage.getItem("agentOn")
        if (!agentState) {
            localStorage.setItem("agentOn", "false");
            this.agentOn = false;
        } else {
            this.agentOn = agentState === "true";
        }
        this.agent = {
            conversationHistory: [],
        }
        this.ongoingStreams = new Map();
        this.observedElement = null;
        this.userHasScrolledManually = false;

        this.localContext = [];

        this.invalidate(async () => {
            this.boundOnChatUpdate = this.onChatUpdate.bind(this);
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, `chat_${assistOS.agent.agentData.id}`, this.boundOnChatUpdate);
        });
    }

    async addToLocalContext(chatRef) {
        this.localContext.push(
            {
                role: chatRef.role,
                message: assistOS.UI.unsanitize(chatRef.message)
            }
        )
    }

    async addToGlobalContext(chatRef) {

    }

    async resetLocalContext(target){
        this.localContext=[];
    }

    onChatUpdate() {
        this.invalidate(async () => this.chat = await spaceModule.getSpaceChat(assistOS.space.id, assistOS.agent.agentData.id));
    }

    async toggleAgentResponse(_target) {
        if (this.agentOn) {
            this.toggleAgentButton.classList.remove("agent-on");
            this.toggleAgentButton.classList.add("agent-off");
            this.toggleAgentButton.innerHTML = "Agent:OFF";
        } else {
            this.toggleAgentButton.classList.remove("agent-off");
            this.toggleAgentButton.classList.add("agent-on");
            this.toggleAgentButton.innerHTML = "Agent:ON";
        }
        this.agentOn = !this.agentOn;
        localStorage.setItem("agentOn", this.agentOn);
    }

    async beforeRender() {
        this.chat = await spaceModule.getSpaceChat(assistOS.space.id, assistOS.agent.agentData.id);
        this.personalities = await assistOS.space.getPersonalitiesMetadata();
        this.toggleAgentResponseButton = this.agentOn ? "Agent:ON" : "Agent:OFF";
        this.agentClassButton = this.agentOn ? "agent-on" : "agent-off";
        this.chatActionButton = `
          <button type="button" id="stopLastStream" data-local-action="sendMessage">
                &rarr;
          </button>
        `
        let stringHTML = "";
        for (let messageIndex = 0; messageIndex < this.chat.length; messageIndex++) {
            let message = this.chat[messageIndex];
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
                if (messageIndex === this.chat.length - 1) {
                    stringHTML += `<chat-item role="${role}" messageIndex="${messageIndex}" user="${message.user}" data-last-item="true" data-presenter="chat-item"></chat-item>`;
                } else {
                    stringHTML += `<chat-item role="${role}" messageIndex="${messageIndex}" user="${message.user}" data-presenter="chat-item"></chat-item>`;
                }
            }
        }
        let personalitiesHTML = "";
        for (let personality of this.personalities) {
            personalitiesHTML += `<list-item data-local-action="swapPersonality ${personality.id}" data-name="${personality.name}" data-highlight="light-highlight"></list-item>`;
        }
        this.personalitiesHTML = personalitiesHTML;
        this.spaceConversation = stringHTML;
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

    async afterRender() {
        this.conversation = this.element.querySelector(".conversation");
        this.userInput = this.element.querySelector("#input");
        this.form = this.element.querySelector(".chat-input-container");

        this.userInput.addEventListener("keydown", this.preventRefreshOnEnter.bind(this, this.form));

        this.toggleAgentButton = this.element.querySelector("#toggleAgentResponse");
        await document.querySelector('space-application-page')?.webSkelPresenter?.toggleChat(undefined, assistOS.UI.chatState, assistOS.UI.chatWidth);
        this.initObservers();
        this.conversation.addEventListener('scroll', () => {
            const threshold = 300;
            const distanceFromBottom =
                this.conversation.scrollHeight
                - this.conversation.scrollTop
                - this.conversation.clientHeight;
            this.userHasScrolledManually = distanceFromBottom > threshold;
        });

        this.chatActionButtonContainer = this.element.querySelector("#actionButtonContainer");
    }

    initObservers() {
        this.intersectionObserver = new IntersectionObserver(entries => {
            for (let entry of entries) {
                if (entry.target === this.observedElement) {
                    if (entry.intersectionRatio < 1) {
                        if (!this.userHasScrolledManually) {
                            this.conversation.scrollTo({top: this.conversation.scrollHeight + 100, behavior: 'auto'});
                        }
                    } else {
                        this.userHasScrolledManually = false;
                    }
                }
            }
        }, {
            root: this.conversation,
            threshold: 1
        });
    }

    /*scrollToElementWithOffset(element) {
        const elementRect = element.getBoundingClientRect();
        const containerRect = this.conversation.getBoundingClientRect();
        const scrollOffset = elementRect.bottom - containerRect.bottom + 80;

        this.conversation.scrollBy({
            top: scrollOffset,
            behavior: 'smooth'
        });
    }

    checkScrollNeeded() {
        if (!this.observedElement || this.lastScrollWasManual) return;

        const elementRect = this.observedElement.getBoundingClientRect();
        const containerRect = this.conversation.getBoundingClientRect();

        if (elementRect.bottom + 30 > containerRect.bottom) {
            this.scrollToElementWithOffset(this.observedElement);
        }
    }*/

    changeStopEndStreamButtonVisibility(visible) {
        this.chatActionButtonContainer.innerHTML = visible ? `
            <button type="button" id="stopLastStream" data-local-action="stopLastStream">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-lg"><rect x="7" y="7" width="10" height="10" rx="1.25" fill="black"></rect></svg>
            </button>` : this.chatActionButton
    }

    async addressEndStream(element) {
        this.ongoingStreams.delete(element);

        if(this.observedElement===element){
            this.intersectionObserver.unobserve(element);
        }
        if (this.ongoingStreams.size === 0) {
            this.changeStopEndStreamButtonVisibility(false);
        }
    }

    async stopLastStream(_target) {
        const getLastStreamedElement = (mapList) => {
            return Array.from(mapList.keys()).pop();
        }
        const lastStreamedElement = getLastStreamedElement(this.ongoingStreams);
        if (lastStreamedElement) {
            await lastStreamedElement.webSkelPresenter.stopResponseStream();
        }
    }

    observerElement(element) {
        if (this.observedElement) {
            this.intersectionObserver.unobserve(this.observedElement);
        }
        this.observedElement = element;
        if (element) {
            this.intersectionObserver.observe(element);
        }
    }

    async handleNewChatStreamedItem(element) {
        this.observerElement(element);
        const presenterElement = element.closest('chat-item');
        this.ongoingStreams.set(presenterElement, true);
        this.changeStopEndStreamButtonVisibility(true);
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

    async displayMessage(role, messageIndex) {
        const messageHTML = `<chat-item role="${role}" messageIndex="${messageIndex}" data-presenter="chat-item" data-last-item="true" user="${assistOS.user.id}"></chat-item>`;
        this.conversation.insertAdjacentHTML("beforeend", messageHTML);
        const lastReplyElement = this.conversation.lastElementChild;
        await this.observerElement(lastReplyElement);
    }

    async createChatUnitResponse() {
        this.chat.push({
            message: "",
            role: "assistant",

        })
        const streamContainerHTML = `<chat-item role="assistant" messageIndex="${this.chat.length - 1}" data-presenter="chat-item" user="${assistOS.agent.agentData.id}" data-last-item="true"/>`;

        this.conversation.insertAdjacentHTML("beforeend", streamContainerHTML);
        const waitForElement = (container, selector) => {
            return new Promise((resolve, reject) => {
                const element = container.querySelector(selector);
                if (element) {
                    resolve(element);
                } else {
                    const observer = new MutationObserver((mutations, me) => {
                        const element = container.querySelector(selector);
                        if (element) {
                            me.disconnect();
                            resolve(element);
                        }
                    });

                    observer.observe(container, {
                        childList: true,
                        subtree: true
                    });

                    setTimeout(() => {
                        observer.disconnect();
                        reject(new Error(`Element ${selector} did not appear in time`));
                    }, 10000);
                }
            });
        };
        return await waitForElement(this.conversation.lastElementChild, '.message');
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

        this.chat.push({
            role: "own",
            message: userRequestMessage
        })

        await this.displayMessage("own", this.chat.length - 1);
        const messageId = (await spaceModule.addSpaceChatMessage(assistOS.space.id, assistOS.agent.agentData.id, userRequestMessage)).messageId


        if (this.agentOn) {
            const streamLocationElement = await this.createChatUnitResponse();
            await assistOS.agent.processUserRequest(unsanitizedMessage, this.localContext, streamLocationElement, messageId);
        }
    }

    refreshRightPanel() {
        let parentComponent = assistOS.UI.getClosestParentElement(this.element, "space-application-page");
        let rightPanel = parentComponent.querySelector(".current-page");
        assistOS.UI.refreshElement(rightPanel);
    }

    async resetConversation() {
        await assistOS.loadifyFunction(async function (spaceModule) {
            await spaceModule.resetSpaceChat(assistOS.space.id, assistOS.agent.agentData.id);
            this.localContext=[];
            this.invalidate();
        }.bind(this, spaceModule));
    }

    async viewAgentContext(_target){
        await assistOS.UI.showModal('view-context-modal',{presenter:`view-context-modal`});
    }

    async saveConversation() {
        await assistOS.loadifyFunction(async function (spaceModule) {
            await spaceModule.saveSpaceChat(assistOS.space.id, assistOS.agent.agentData.id);
            await assistOS.loadAgent(assistOS.space.id);
            this.invalidate();
        }.bind(this, spaceModule));
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
            this.localContext=[];
        }, id);
    }
}
