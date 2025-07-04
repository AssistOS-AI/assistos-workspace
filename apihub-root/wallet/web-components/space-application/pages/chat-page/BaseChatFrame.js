const agentModule = assistOS.loadModule("agent");
const chatModule = assistOS.loadModule("chat");
const IFrameContext = window.assistOS === undefined;
const UI = IFrameContext ? window.UI : window.assistOS.UI

import chatUtils from "./chatUtils.js";
export class BaseChatFrame {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.agentOn = true;
        this.ongoingStreams = new Map();
        this.observedElement = null;
        this.spaceId = this.element.getAttribute('data-spaceId');
        this.agent = assistOS.agent;
        this.userHasScrolledManually = false;
        if (IFrameContext) {
            this.invalidate();
        }
    }

    async beforeRender() {
        this.personalities = await agentModule.getAgents(this.spaceId);

        let personalitiesHTML = "";
        for (let personality of this.personalities) {
            personalitiesHTML += `<list-item data-local-action="swapPersonality ${personality.id}" data-name="${personality.name}" data-highlight="light-highlight"></list-item>`;
        }

        this.personalitiesHTML = personalitiesHTML;

        this.currentPersonalityName = this.agent.name;

        let llmName = this.agent.selectedChatLlm;
        if (llmName) {
            llmName = llmName.split("/")[0];
        } else {
            llmName = "No LLM Configured";
        }
        this.personalityLLM = llmName


        this.personalityLLM = this.personalityLLM.length > 17 ? this.personalityLLM.substring(0, 17) + "..." : this.personalityLLM;
        this.spaceName = assistOS.space.name.length > 15 ? assistOS.space.name.substring(0, 15) + "..." : assistOS.space.name;
        this.spaceNameTooltip = assistOS.space.name;
        this.personalityLLMTooltip = llmName;
        this.chatOptions = chatUtils.IFrameChatOptions;

        this.chatId = this.element.getAttribute('data-chatId');
        this.agentName = this.element.getAttribute('data-agent-name');
        this.spaceId = this.element.getAttribute('data-spaceId');
        this.userId = this.element.getAttribute('data-userId');

        try {
            this.chatMessages = await chatModule.getChatMessages(this.spaceId, this.chatId)
        } catch (error) {
            this.errorState = true;
        }

        this.chatActionButton = chatUtils.sendMessageActionButtonHTML

        this.stringHTML = "";
        for (let messageIndex = 0; messageIndex < this.chatMessages.length; messageIndex++) {
            const chatMessage = this.chatMessages[messageIndex]
            let role = chatUtils.getChatItemRole(chatMessage)

            if (!role) {
                continue;
            }

            const user = chatUtils.getChatItemUser(chatMessage);
            let ownMessage = false;
            if (user === this.userId || role === "user" && IFrameContext) {
                ownMessage = true;
            }
            let isContext = chatMessage.commands?.replay?.isContext || "false";

            if (messageIndex === this.chatMessages.length - 1) {
                this.stringHTML += `<chat-item role="${role}"  spaceId="${this.spaceId}" ownMessage="${ownMessage}" id="${chatMessage.id}" isContext="${isContext}" messageIndex="${messageIndex}" user="${user}" data-last-item="true" data-presenter="chat-item"></chat-item>`;
            } else {
                this.stringHTML += `<chat-item role="${role}"  spaceId="${this.spaceId}" ownMessage="${ownMessage}" id="${chatMessage.id}" isContext="${isContext}"  messageIndex="${messageIndex}" user="${user}" data-presenter="chat-item"></chat-item>`;
            }
        }
        this.spaceConversation = this.stringHTML;

    }

    async afterRender() {
        let slowResponse = await chatModule.listenForMessages(this.spaceId, this.chatId);
        slowResponse.onProgress(async (response) => {
            if(response.from === "User") {
                const nextReplyIndex = this.chatMessages.length;
                const element = await this.displayMessage("own", nextReplyIndex);
                return;
            }

            const streamLocationElement = await this.createChatUnitResponse();
            let currentMessageIndex = this.chatMessages.length - 1;
            this.chatMessages[currentMessageIndex] = {
                role: "assistant",
                text: response.message,
                name: this.agentName,
            };
            const responseElement = streamLocationElement.closest('chat-item');
            //responseElement.setAttribute(`id`, id);
            responseElement.webSkelPresenter.invalidate();
        });

        this.conversation = this.element.querySelector(".conversation");
        this.userInput = this.element.querySelector("#input");
        this.form = this.element.querySelector(".chat-input-container");

        this.userInput.addEventListener("keydown", this.preventRefreshOnEnter.bind(this, this.form));
        this.toggleAgentButton = this.element.querySelector("#toggleAgentResponse");
        this.conversation.addEventListener('scroll', () => {
            const threshold = 300;
            const distanceFromBottom = this.conversation.scrollHeight - this.conversation.scrollTop - this.conversation.clientHeight;
            this.userHasScrolledManually = distanceFromBottom > threshold;
        });
        this.chatActionButtonContainer = this.element.querySelector("#actionButtonContainer");
        this.maxHeight = 500;
        const maxHeight = 500;
        const form = this.form;
        this.userInput.addEventListener('input', function (event) {
            this.style.height = "auto";
            this.style.height = Math.min(this.scrollHeight, maxHeight) + "px";
            this.style.overflowY = this.scrollHeight > maxHeight ? "auto" : "hidden";
            form.height = "auto";
            form.height = Math.min(this.scrollHeight, maxHeight) + "px";
            form.overflowY = this.scrollHeight > maxHeight ? "auto" : "hidden";
        });

        this.initObservers();
    }

    async handleChatEvent(eventData) {
        const handleMessageEvent = async (eventData) => {
            const action = eventData.action;
            switch (action) {
                case 'add':
                    this.invalidate();
                    break;
                case 'reset':
                    this.invalidate();
                    break;
                default:
            }
        }
        const handleContextEvent = async (eventData) => {
            const action = eventData.action;
            switch (action) {
                case 'add':
                    this.invalidate();
                    break;
                case 'delete':
                    this.invalidate();
                    break;
                case 'update':
                    break;
                case 'reset':
                    this.invalidate();
                default:
            }
        }
        switch (eventData.type) {
            case "messages":
                await handleMessageEvent(eventData);
                break;
            case "context":
                await handleContextEvent(eventData);
                break;
            default:
                console.warn("Unknown event type", eventData.type);
        }
    }

    async preventRefreshOnEnter(form, event) {
        if (event.key === "Enter") {
            event.preventDefault();
            if (!event.ctrlKey) {
                await this.sendMessage(form);
                this.userInput.scrollIntoView({behavior: "smooth", block: "end"});
            } else {
                this.userInput.value += '\n';
                this.userInput.style.height = `${this.userInput.scrollHeight}px`;
            }
        }
    }

    async sendQuery(spaceId, chatId, personalityId, prompt, responseContainerLocation) {
        const controller = new AbortController();
        const requestData = {prompt}
        const response = await fetch(`/chats/query/${spaceId}/${personalityId}/${chatId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify(requestData),
        });
        if (!response.ok) {
            const error = await response.json();
            alert(`Error: ${error.message}`);
            return;
        }
        const valuesTracked = new Set(["userMessageId", "responseMessageId"]);
        const {
            userMessageId,
            responseMessageId
        } = await this.dataStreamContainer(response, responseContainerLocation, controller, valuesTracked);
        return {userMessageId, responseMessageId};
    };

    async sendMessage(_target) {
        let formInfo = await UI.extractFormInformation(_target);
        const userMessage = UI.customTrim(formInfo.data.input)
        formInfo.elements.input.element.value = "";
        if (!userMessage.trim()) {
            return;
        }

        this.chatMessages.push({
            text: userMessage,
            role: "user",
            name: this.userId
        })

        this.userInput.style.height = "auto"
        this.form.style.height = "auto"

        await chatModule.chatInput(this.spaceId, this.chatId, "User", userMessage);
    }

    async displayMessage(role, messageIndex) {
        const messageHTML = `<chat-item role="${role}" spaceId="${this.spaceId}" ownMessage="true" messageIndex="${messageIndex}" data-presenter="chat-item" data-last-item="true" user="${this.userId}"></chat-item>`;
        this.conversation.insertAdjacentHTML("beforeend", messageHTML);
        const lastReplyElement = this.conversation.lastElementChild;
        await this.observerElement(lastReplyElement);
        await waitForElement(lastReplyElement, '.message');
        return lastReplyElement;
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

    initObservers() {
        this.intersectionObserver = new IntersectionObserver(entries => {
            for (let entry of entries) {
                if (entry.target === this.observedElement) {
                    if (entry.intersectionRatio < 1) {
                        if (!this.userHasScrolledManually) {
                            this.conversation.scrollTo({
                                top: this.conversation.scrollHeight + 100,
                                behavior: 'auto'
                            });
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

    changeStopEndStreamButtonVisibility(visible) {
        this.chatActionButtonContainer.innerHTML = visible ? chatUtils.stopStreamActionButtonHTML : chatUtils.sendMessageActionButtonHTML
    }

    async addressEndStream(element) {
        this.ongoingStreams.delete(element);

        if (this.observedElement === element) {
            this.intersectionObserver.unobserve(element);
        }
        if (this.ongoingStreams.size === 0) {
            this.observerElement()
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

    getMessage(messageIndex) {
        return this.chatMessages[messageIndex]
    }

    async createChatUnitResponse() {
        this.chatMessages.push({
            text: "Processing Request ... ",
            role: "assistant",
            name: this.agentName
        });

        const streamContainerHTML = `<chat-item spaceId="${this.spaceId}" role="assistant" ownMessage="false" messageIndex="${this.chatMessages.length - 1}" data-presenter="chat-item" user="${this.agentName}" data-last-item="true"/>`;
        this.conversation.insertAdjacentHTML("beforeend", streamContainerHTML);

        return await chatUtils.waitForElement(this.conversation.lastElementChild, '.message');
    }

    async dataStreamContainer(response, responseContainerLocation, controller, trackedValuesSet) {
        const responseContainerPresenter = responseContainerLocation.closest("[data-presenter]")?.webSkelPresenter;
        const reader = response.body.getReader();

        await responseContainerPresenter.handleStartStream(controller);

        const decoder = new TextDecoder("utf-8");
        let buffer = '';
        let markdownBuffer = ''

        const trackedValuesResponse = {}

        const handleStreamEvent = (event, responseContainerLocation) => {
            try {
                if (event.data !== "") {
                    const json = JSON.parse(event.data)
                    if (json.sessionId) {
                        this.sessionId = json.sessionId
                    }
                    if (json.message) {
                        markdownBuffer += json.message
                        responseContainerPresenter.message.text = markdownBuffer;
                        responseContainerLocation.innerHTML = marked.parse(markdownBuffer)
                    }
                    for (const trackedVal of trackedValuesSet) {
                        if (json[trackedVal]) {
                            trackedValuesResponse[trackedVal] = json[trackedVal];
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to parse event data:', e)
            }
        }

        while (true) {
            const {done, value} = await reader.read();
            if (done) {
                await responseContainerPresenter.handleEndStream();
                break;
            }
            buffer += decoder.decode(value, {stream: true});
            let lines = buffer.split("\n");

            buffer = lines.pop();

            for (let line of lines) {
                if (line.startsWith("event:")) {
                    const eventName = line.replace("event:", "").trim();
                    lines.shift();
                    const eventData = lines.shift().replace("data:", "").trim();
                    handleStreamEvent({type: eventName, data: eventData}, responseContainerLocation);
                } else if (line.startsWith("data:")) {
                    const eventData = line.replace("data:", "").trim();
                    handleStreamEvent({type: "message", data: eventData}, responseContainerLocation);
                }
            }
        }
        if (buffer.trim()) {
            handleStreamEvent({type: "message", data: buffer.trim()}, responseContainerLocation);
        }
        return trackedValuesResponse;
    }

    async newConversation(target) {
        const chatId = await chatUtils.createNewChat(this.spaceId, this.agentName);
        if (IFrameContext) {
            document.cookie = "chatId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
            document.cookie = `chatId=${chatId}`;
        }
        this.element.setAttribute('data-chatId', chatId);
        this.invalidate();
    }

    async resetConversation() {
        await chatUtils.resetChat(this.spaceId, this.chatId);
        this.invalidate();
    }

    async resetLocalContext(target) {
        await chatUtils.resetChatContext(this.spaceId, this.chatId);
        this.invalidate();
    }

    async viewAgentContext(_target) {
        await UI.showModal('view-context-modal', {
            presenter: `view-context-modal`,
            chatId: this.chatId,
            spaceId: this.spaceId
        });
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

    async addToLocalContext(chatMessageId, chatItemElement) {
        await chatUtils.addToLocalContext(this.spaceId, this.chatId, chatMessageId);
        chatItemElement.classList.add('context-message');
    }
}