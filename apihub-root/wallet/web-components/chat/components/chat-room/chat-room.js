const chatModule = assistOS.loadModule("chat");
const webAssistantModule = assistOS.loadModule("webassistant");
import chatUtils from "../../chatUtils.js";

export class ChatRoom {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.agentOn = true;
        this.ongoingStreams = new Map();
        this.spaceId = this.element.getAttribute('data-space-id');
        this.userHasScrolledManually = false;
        this.isProgrammaticScroll = false;
        this.invalidate();
    }

    async beforeRender() {
        let webAssistant = await webAssistantModule.getWebAssistant(this.spaceId);
        this.agentName = webAssistant.agentName;
        this.chatOptions = chatUtils.IFrameChatOptions;
        this.plusIcon = chatUtils.getChatImageURL("./wallet/assets/icons/plus.svg")
        this.chatId = this.element.getAttribute('data-chat-id');
        this.agentName = this.element.getAttribute('data-agent-name');
        this.spaceId = this.element.getAttribute('data-space-id');
        this.userEmail = this.element.getAttribute('data-user-email');
        let availableComponents = await chatModule.getComponentsForChatRoomInstance(this.spaceId, this.chatId);
        this.availableComponents = "";
        for (let component of availableComponents) {
            this.availableComponents += `<list-item data-local-action="openContextPage ${component.componentName} ${component.appName || ""}" data-name="${component.name}" data-highlight="light-highlight"></list-item>`;
        }
        try {
            this.chatHistory = await chatModule.getChatHistory(this.spaceId, this.chatId);
        } catch (error) {
            this.errorState = true;
        }

        this.chatActionButton = chatUtils.sendMessageActionButtonHTML

        this.stringHTML = "";
        for (let messageIndex = 0; messageIndex < this.chatHistory.length; messageIndex++) {
            const chatMessage = this.chatHistory[messageIndex]
            let ownMessage = false;
            let userEmailAttribute = "";
            if (chatMessage.from === "User") {
                ownMessage = true;
                userEmailAttribute = `user-email="${chatMessage.name}"`;
            }

            let lastReply = messageIndex === this.chatHistory.length - 1 ? "true" : "false";
            this.stringHTML += `<chat-item data-id="${chatMessage.truid}" spaceId="${this.spaceId}" ownMessage="${ownMessage}" ${userEmailAttribute} data-last-item="${lastReply}" data-presenter="chat-item"></chat-item>`;
        }
        this.spaceConversation = this.stringHTML;
    }

    async afterRender() {
        this.chatPagePresenter = this.element.parentElement.closest("[data-presenter]").webSkelPresenter;
        const constants = AssistOS.constants;
        const client = await chatModule.getClient(constants.CHAT_ROOM_PLUGIN, this.spaceId);
        let observableResponse = chatModule.listenForMessages(this.spaceId, this.chatId, client);
        observableResponse.onProgress(async (reply) => {
            if (reply.from === "User") {
                this.chatHistory.push(reply);
                await this.displayUserReply(reply.truid, assistOS.user.email);
                this.userHasScrolledManually = false;
                this.scrollToBottom();
                return;
            }
            if(this.chatPagePresenter.handleReply){
                reply = this.chatPagePresenter.handleReply(reply);
            }
            let existingReply = this.chatHistory.find(msg => msg.truid === reply.truid);
            if (existingReply) {
                let chatItem = this.conversation.querySelector(`chat-item[data-id="${reply.truid}"]`);
                chatItem.webSkelPresenter.updateReply(reply);
                this.scrollToBottom();
                return;
            }
            this.chatHistory.push(reply);
            await this.displayAgentReply(reply.truid);
            this.scrollToBottom();
        });

        observableResponse.onError(async (error) => {
            console.error('Error in chat:', error);
            console.log(error.code);
        });

        this.conversation = this.element.querySelector(".conversation");
        this.userInput = this.element.querySelector("#input");
        this.form = this.element.querySelector(".chat-input-container");

        this.userInput.addEventListener("keydown", this.preventRefreshOnEnter.bind(this, this.form));
        this.toggleAgentButton = this.element.querySelector("#toggleAgentResponse");
        this.conversation.addEventListener('scroll', () => {
            if (this.isProgrammaticScroll) { return; }
            const threshold = 5; // pixels from bottom
            const isAtBottom = this.conversation.scrollHeight - this.conversation.scrollTop - this.conversation.clientHeight < threshold;
            this.userHasScrolledManually = !isAtBottom;
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

    }

    async preventRefreshOnEnter(form, event) {
        if (event.key === "Enter") {
            event.preventDefault();
            if (!event.ctrlKey) {
                await this.chatInputUser(form);
                this.userInput.scrollIntoView({ behavior: "smooth", block: "end" });
            } else {
                this.userInput.value += '\n';
                this.userInput.style.height = `${this.userInput.scrollHeight}px`;
            }
        }
    }

    async chatInputUser(_target) {
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        let userMessage = assistOS.UI.customTrim(formInfo.data.input)
        formInfo.elements.input.element.value = "";
        if (!userMessage.trim()) {
            return;
        }

        this.chatHistory.push({
            text: userMessage,
            role: "user",
            name: this.userEmail
        })

        this.userInput.style.height = "auto";
        this.form.style.height = "auto";
        userMessage = assistOS.UI.unsanitize(userMessage);
        if(this.chatPagePresenter.getChatUIContext){
            let UIContext = await this.chatPagePresenter.getChatUIContext();
            await chatModule.setChatUIContext(this.spaceId, this.chatId, UIContext);
        }

        await chatModule.chatInput(this.spaceId, this.chatId, "User", userMessage, "human");
    }

    async displayUserReply(replyId, userEmail) {
        const messageHTML = `<chat-item data-id="${replyId}" user-email="${userEmail}" spaceId="${this.spaceId}" ownMessage="true" data-presenter="chat-item" data-last-item="true"></chat-item>`;
        this.conversation.insertAdjacentHTML("beforeend", messageHTML);
        return await chatUtils.waitForElement(this.conversation.lastElementChild, '.message');
    }

    scrollToBottom() {
        if (this.userHasScrolledManually) {
            return;
        }
        this.isProgrammaticScroll = true;
        this.conversation.scrollTo({ top: this.conversation.scrollHeight, behavior: 'smooth' });
        setTimeout(() => {
            this.isProgrammaticScroll = false;
        }, 400); // Corresponds to smooth scroll duration
    }

    startStreaming(element) {
        this.ongoingStreams.set(element, true);
        this.changeStopEndStreamButtonVisibility(true);
    }

    changeStopEndStreamButtonVisibility(visible) {
        this.chatActionButtonContainer.innerHTML = visible ? chatUtils.stopStreamActionButtonHTML : chatUtils.sendMessageActionButtonHTML
    }

    endStreaming(element) {
        this.ongoingStreams.delete(element);
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

    getReply(replyId) {
        return this.chatHistory.find(message => message.truid === replyId) || null;
    }

    async displayAgentReply(replyId) {
        const streamContainerHTML = `<chat-item data-id="${replyId}" spaceId="${this.spaceId}" ownMessage="false" data-presenter="chat-item" agent-name="${this.agentName}" data-last-item="true"/>`;
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
            const { done, value } = await reader.read();
            if (done) {
                await responseContainerPresenter.handleEndStream();
                break;
            }
            buffer += decoder.decode(value, { stream: true });
            let lines = buffer.split("\n");

            buffer = lines.pop();

            for (let line of lines) {
                if (line.startsWith("event:")) {
                    const eventName = line.replace("event:", "").trim();
                    lines.shift();
                    const eventData = lines.shift().replace("data:", "").trim();
                    handleStreamEvent({ type: eventName, data: eventData }, responseContainerLocation);
                } else if (line.startsWith("data:")) {
                    const eventData = line.replace("data:", "").trim();
                    handleStreamEvent({ type: "message", data: eventData }, responseContainerLocation);
                }
            }
        }
        if (buffer.trim()) {
            handleStreamEvent({ type: "message", data: buffer.trim() }, responseContainerLocation);
        }
        return trackedValuesResponse;
    }

    async newChat(target) {
        const chatId = await assistOS.UI.showModal('create-chat', {}, true);
        if (!chatId) {
            return;
        }
        if (assistOS.iframe) {
            document.cookie = "chatId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
            document.cookie = `chatId=${chatId}`;
        }
        await chatModule.stopListeningForMessages(this.spaceId, this.chatId);
        this.element.setAttribute('data-chatId', chatId);
        this.invalidate();
    }

    hideSettings(controller, container, event) {
        container.setAttribute("data-local-action", "showSettings off");
        let target = this.element.querySelector(".settings-list-container");
        target.style.display = "none";
        controller.abort();
    }

    async showSettings(_target, mode) {
        if (mode === "off") {
            let target = this.element.querySelector(".settings-list-container");
            target.style.display = "flex";
            let controller = new AbortController();
            document.addEventListener("click", this.hideSettings.bind(this, controller, _target), { signal: controller.signal });
            _target.setAttribute("data-local-action", "showSettings on");
        }
    }
    async loadChat() {
        let chatId = await assistOS.UI.showModal("select-chat", { "chat-id": this.chatId }, true);
        if (chatId) {
            await this.openChat("", chatId);
        }
    }
    async openChat(button, chatId) {
        if (assistOS.iframe) {
            document.cookie = "chatId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
            document.cookie = `chatId=${chatId}`;
        }
        await chatModule.stopListeningForMessages(this.spaceId, this.chatId);
        this.element.setAttribute('data-chatId', chatId);
        this.invalidate();
    }
    async resetChat(){
        await chatModule.resetChatRoom(this.spaceId, this.chatId);
        this.invalidate();
    }

    async afterUnload() {
        await chatModule.stopListeningForMessages(this.spaceId, this.chatId);
    }
}