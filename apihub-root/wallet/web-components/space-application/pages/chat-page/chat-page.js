const agentModule = require("assistos").loadModule("agent", {});
const chatModule = require("assistos").loadModule("chat", {});

const generateRequest = function (method, headers = {}, body = null) {
    return async function (url) {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });
        return response.json();
    };
};

const addToLocalContext = async (spaceId, chatId, messageId) => {
    const request = generateRequest("POST", {"Content-Type": "application/json"});
    const response = await request(`/chats/context/${spaceId}/${chatId}/${messageId}`);
}
const createNewChat = async (spaceId, personalityId) => {
 await chatModule.create
};




const resetChat = (spaceId, chatId) => {
    const request = generateRequest("POST", {"Content-Type": "application/json"})
    return request(`/chats/reset/${spaceId}/${chatId}`)
}

const resetChatContext = (spaceId, chatId) => {
    const request = generateRequest("POST", {"Content-Type": "application/json"})
    return request(`/chats/reset/context/${spaceId}/${chatId}`)
}

const sendMessageActionButtonHTML = `  
<button type="button" id="stopLastStream" data-local-action="sendMessage">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="white"/>
    </svg>
</button>
`

const stopStreamActionButtonHTML = `
<button type="button" id="stopLastStream" data-local-action="stopLastStream">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-lg"><rect x="7" y="7" width="10" height="10" rx="1.25" fill="white"></rect></svg>
</button>
`

const chatOptions = `
    <list-item data-local-action="newConversation" data-name="New Conversation" data-highlight="light-highlight"></list-item>
                        <list-item data-local-action="resetConversation" data-name="Reset Conversation" data-highlight="light-highlight"></list-item>
                        <list-item data-local-action="resetLocalContext" data-name="Reset Agent Context" data-highlight="light-highlight"></list-item>
                        <list-item data-local-action="viewAgentContext" data-name="Edit Agent Context" data-highlight="light-highlight"></list-item>
                        <list-item data-local-action="uploadFile" data-name="Upload File" data-highlight="light-highlight"></list-item>
                        <input type="file" class="file-input hidden">
`
const IFrameChatOptions = `
<list-item data-local-action="newConversation" data-name="New Conversation" data-highlight="light-highlight"></list-item>
<list-item data-local-action="resetConversation" data-name="Reset Conversation" data-highlight="light-highlight"></list-item>
                        <list-item data-local-action="resetLocalContext" data-name="Reset Agent Context" data-highlight="light-highlight"></list-item>
                        <list-item data-local-action="viewAgentContext" data-name="Edit Agent Context" data-highlight="light-highlight"></list-item>
`

const getChatItemRole = function (chatItem) {
    return chatItem.commands?.replay?.role || null;
}
const getChatItemUser = function (chatItem) {
    return chatItem.commands?.replay?.name || null;
}

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

const IFrameContext = window.assistOS === undefined;
const UI = IFrameContext ? window.UI : window.assistOS.UI

class BaseChatFrame {
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
        if(llmName){
            llmName = llmName.split("/")[0];
        }else{
            llmName = "No LLM Configured";
        }
        this.personalityLLM=llmName


        this.personalityLLM = this.personalityLLM.length > 17 ? this.personalityLLM.substring(0, 17) + "..." : this.personalityLLM;
        this.spaceName = assistOS.space.name.length > 15 ? assistOS.space.name.substring(0, 15) + "..." : assistOS.space.name;
        this.spaceNameTooltip = assistOS.space.name;
        this.personalityLLMTooltip = llmName;
        this.chatOptions = IFrameChatOptions;

        this.chatId = this.element.getAttribute('data-chatId');
        this.agentId = this.element.getAttribute('data-personalityId');
        this.spaceId = this.element.getAttribute('data-spaceId');
        this.userId = this.element.getAttribute('data-userId');

        try {
            this.chatMessages = await chatModule.getChatMessages(this.spaceId, this.chatId)
        } catch (error) {
            this.errorState = true;
        }

        this.chatActionButton = sendMessageActionButtonHTML

        this.stringHTML = "";
        for (let messageIndex = 0; messageIndex < this.chatMessages.length; messageIndex++) {
            const chatMessage = this.chatMessages[messageIndex]
            let role = getChatItemRole(chatMessage)

            if (!role) {
                continue;
            }

            const user = getChatItemUser(chatMessage);
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
        this.conversation = this.element.querySelector(".conversation");
        this.userInput = this.element.querySelector("#input");
        this.form = this.element.querySelector(".chat-input-container");

        this.userInput.addEventListener("keydown", this.preventRefreshOnEnter.bind(this, this.form));
        this.toggleAgentButton = this.element.querySelector("#toggleAgentResponse");
        this.conversation.addEventListener('scroll', () => {
            const threshold = 300;
            const distanceFromBottom =
                this.conversation.scrollHeight
                - this.conversation.scrollTop
                - this.conversation.clientHeight;
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
         const requestData={prompt}
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
        const userRequestMessage = UI.customTrim(formInfo.data.input)
        formInfo.elements.input.element.value = "";
        if (!userRequestMessage.trim()) {
            return;
        }

        const nextReplyIndex = this.chatMessages.length;

        this.chatMessages.push(
            {
                text: userRequestMessage,
                commands: {
                    replay: {
                        role: "user",
                        name: this.userId
                    }
                }
            }
        )

        this.userInput.style.height = "auto"
        this.form.style.height = "auto"

        const element = await this.displayMessage("own", nextReplyIndex);
        let messageId;

        if (this.agentOn) {
            const streamLocationElement = await this.createChatUnitResponse();
            let currentMessageIndex = this.chatMessages.length - 1;
            const {id} = await agentModule.sendChatQuery(this.spaceId, this.chatId, this.agentId,assistOS.user.id,userRequestMessage);
            this.chatMessages[currentMessageIndex]= await chatModule.getChatMessage(this.spaceId, this.chatId, id);
            const responseElement = streamLocationElement.closest('chat-item');
            responseElement.setAttribute(`id`, id);
            responseElement.webSkelPresenter.invalidate();
         /*   const {
                userMessageId,
                responseMessageId
            } = await this.sendQuery(this.spaceId, this.chatId, this.agentId, userRequestMessage, streamLocationElement)
            element.setAttribute(`id`, userMessageId);
            element.webSkelPresenter.invalidate();
            const responseElement = streamLocationElement.closest('chat-item');
            responseElement.setAttribute(`id`, responseMessageId);
            responseElement.webSkelPresenter.invalidate();*/
        } else {
            messageId = await chatModule.sendMessage(this.spaceId, this.chatId, assistOS.user.id, userRequestMessage, "user")
            element.setAttribute(`id`, messageId);
            element.webSkelPresenter.invalidate();
        }
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
        this.chatActionButtonContainer.innerHTML = visible ? stopStreamActionButtonHTML : sendMessageActionButtonHTML
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
        this.chatMessages.push(
            {
                text: "Processing Request ... ",
                commands: {
                    replay: {
                        role: "assistant",
                        name: this.agentId
                    }
                }
            }
        )

        const streamContainerHTML = `<chat-item spaceId="${this.spaceId}" role="assistant" ownMessage="false" messageIndex="${this.chatMessages.length - 1}" data-presenter="chat-item" user="${this.agentId}" data-last-item="true"/>`;
        this.conversation.insertAdjacentHTML("beforeend", streamContainerHTML);

        return await waitForElement(this.conversation.lastElementChild, '.message');
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
        const chatId = await createNewChat(this.spaceId, this.agentId);
        if (IFrameContext) {
            document.cookie = "chatId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
            document.cookie = `chatId=${chatId}`;
        }
        this.element.setAttribute('data-chatId', chatId);
        this.invalidate();
    }

    async resetConversation() {
        await resetChat(this.spaceId, this.chatId);
        this.invalidate();
    }

    async resetLocalContext(target) {
        await resetChatContext(this.spaceId, this.chatId);
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
        await addToLocalContext(this.spaceId, this.chatId, chatMessageId);
        chatItemElement.classList.add('context-message');
    }
}

let ChatPage;

if (IFrameContext) {
    ChatPage = BaseChatFrame;
} else {
    ChatPage = class ChatPageContext extends BaseChatFrame {
        constructor(element, invalidate) {
            super(element, invalidate)
            const agentState = localStorage.getItem("agentOn")
            if (!agentState) {
                localStorage.setItem("agentOn", "true");
                this.agentOn = true;
            } else {
                this.agentOn = agentState === "true";
            }
            this.invalidate();
        }

        async beforeRender() {
            await super.beforeRender();
            if (this.isSubscribed === undefined) {
                this.isSubscribed = true;
            }
            this.chatOptions = chatOptions;
            this.toggleAgentResponseButton = `
                <button type="button" id="toggleAgentResponse" class="${this.agentOn ? "agent-on" : "agent-off"}"
                        data-local-action="toggleAgentResponse">${this.agentOn ? "Agent:ON" : "Agent:OFF"}</button>`;
            this.checked = this.agentOn ? "checked" : "";
        }

        async afterRender() {
            await super.afterRender()
            await document.querySelector('left-sidebar')?.webSkelPresenter?.toggleChat(undefined, UI.chatState, UI.chatWidth);
            const agentToggleCheckbox = this.element.querySelector('#chat-toggle')
            agentToggleCheckbox.addEventListener('change', this.toggleAgentResponse.bind(this));
        }

        setSpaceContainer() {
            if (!this.spaceContainer) {
                this.spaceContainer = document.getElementById("space-page-container");
            }
            return this.spaceContainer;
        }

        async toggleFullScreen(_target) {
            this.setSpaceContainer();
            const agentPage = this.element
            agentPage.style.display = "flex";
            agentPage.style.width = "calc(100vw - 75px)";
            agentPage.style.minWidth = "calc(100vw - 75px)";
            this.spaceContainer.style.display = "none";
        }

        async toggleHalfScreen(_target) {
            this.setSpaceContainer();
            const agentPage = this.element
            agentPage.style.display = "flex";
            this.spaceContainer.style.display = "flex";
            agentPage.style.width = "calc(50vw - 37.5px)";
            agentPage.style.minWidth = "calc(50vw - 37.5px)";
            this.spaceContainer.style.width = "calc(50vw - 37.5px)";
            this.spaceContainer.style.minWidth = "calc(50vw - 37.5px)";
        }

        async toggleThirdScreen(_target) {
            this.setSpaceContainer();
            const agentPage = this.element
            agentPage.style.display = "flex";
            this.spaceContainer.style.display = "flex";
            agentPage.style.width = "calc(30vw - 37.5px)";
            agentPage.style.minWidth = "calc(30vw - 37.5px)";
            this.spaceContainer.style.width = "calc(70vw - 37.5px)";
            this.spaceContainer.style.minWidth = "calc(70vw - 37.5px)";
        }

        async toggleMinimizeScreen(_target) {
            this.setSpaceContainer();
            const agentPage = this.element
            UI.chatState = "minimized";
            agentPage.style.display = "none";
            agentPage.style.width = "0px";
            agentPage.style.minWidth = "0px";
            this.spaceContainer.style.display = "flex";
            this.spaceContainer.style.width = "calc(100vw - 75px)";
            this.spaceContainer.style.minWidth = "calc(100vw - 75px)";
        }

        async swapPersonality(_target, id) {
            await assistOS.changeAgent(id);
            this.invalidate();
        }

        async hidePersonalities(controller, arrow, event) {
            arrow.setAttribute("data-local-action", "showPersonalities off");
            let target = this.element.querySelector(".personalities-list");
            target.style.display = "none";
            controller.abort();
        }

        async showPersonalities(_target, mode) {
            if (mode === "off") {
                let list = this.element.querySelector(".personalities-list");
                list.style.display = "flex";
                let controller = new AbortController();
                document.addEventListener("click", this.hidePersonalities.bind(this, controller, _target), {signal: controller.signal});
                _target.setAttribute("data-local-action", "showPersonalities on");
            }
        }

        async toggleAgentResponse(_target) {
            this.agentOn = !this.agentOn;
            localStorage.setItem("agentOn", this.agentOn);
        }

        uploadFile(_target) {
            let fileInput = this.element.querySelector(".file-input");
            fileInput.click();
        }
    }
}

export {ChatPage};

