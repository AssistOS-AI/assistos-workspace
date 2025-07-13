const WebAssistant = require("assistos").loadModule("webassistant", {});

const sendMessageActionButtonHTML = `  
<button type="button" id="stopLastStream" class="input__button" data-local-action="sendMessage">
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.6 29.1375C6.1 29.3375 5.625 29.2935 5.175 29.0055C4.725 28.7175 4.5 28.299 4.5 27.75V21L16.5 18L4.5 15V8.24996C4.5 7.69996 4.725 7.28146 5.175 6.99446C5.625 6.70746 6.1 6.66346 6.6 6.86246L29.7 16.6125C30.325 16.8875 30.6375 17.35 30.6375 18C30.6375 18.65 30.325 19.1125 29.7 19.3875L6.6 29.1375Z" fill="#8B8B8B"/>
</svg>
</button>
`
const stopStreamActionButtonHTML = `
<button type="button" id="stopLastStream" class="input__button" data-local-action="stopLastStream">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-lg"><rect x="7" y="7" width="10" height="10" rx="1.25" fill="black"></rect></svg>
</button>
`
let IFrameChatOptions = `
<div class="preview-sidebar-item">
<list-item data-local-action="newConversation" data-name="New Conversation" data-highlight="light-highlight"></list-item>
</div>
<div class="preview-sidebar-item">
<list-item data-local-action="resetConversation" data-name="Reset Conversation" data-highlight="light-highlight"></list-item>
</div>
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

async function applyTheme(themeVars, customCSS) {
    const rootCSS = generateRootCSS(themeVars)
    const valid = await validateCSS(customCSS)

    const styleEl = document.getElementById('theme-style') || document.createElement('style')
    styleEl.id = 'theme-style'
    styleEl.textContent = valid ? `${rootCSS}\n\n${customCSS}` : rootCSS
    document.head.appendChild(styleEl)
}

async function validateCSS(css) {
    try {
        const sheet = new CSSStyleSheet()
        await sheet.replace(css)
        return true
    } catch {
        return false
    }
}

function generateRootCSS(themeVars) {
    const entries = Object.entries(themeVars).map(([key, val]) => `${key}: ${val};`)
    return `:root { ${entries.join(' ')} }`
}


const IFrameContext = window.assistOS === undefined;
const UI = window.UI

class BaseChatFrame {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.agentOn = true;
        this.ongoingStreams = new Map();
        this.observedElement = null;
        this.userHasScrolledManually = false;
        this.props = props;
        this.invalidate();
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

    async beforeRender() {
        this.chatId = this.props.chatId;
        this.personalityId = this.props.personalityId;
        this.spaceId = this.props.spaceId;
        this.userId = this.props.userId;
        this.pageId = this.props.pageId;

        if (!this.currentPageId) {
            this.configuration = await WebAssistant.getWebAssistant(this.spaceId);
            if (!this.pageId) {
                const homePageConfig = await WebAssistant.getHomePage(this.spaceId);
                this.currentPageId = homePageConfig.id;
            } else {
                this.currentPageId = this.pageId;
            }
        }
        const menu = await WebAssistant.getMenu(this.spaceId);


        this.page = await WebAssistant.getPage(this.spaceId, this.currentPageId);
        this.pageName = this.page.name;
        this.previewContentSidebar = menu.map((menuItem) => {
            return ` <li class="preview-sidebar-item" data-local-action="openPreviewPage ${menuItem.targetPage}">
                        <span><img src="${menuItem.icon}" class="menu-icon-img" alt="Menu Icon"></span> <span class="menu-item-name">${menuItem.name}</span>
                    </li>`
        }).join('');
        this.previewContentSidebar += `<li class="preview-sidebar-item">
           <span>Chats</span>
           <span data-local-action="newChat">
           New Chat
            </span>
        </li>`
        this.previewContentStateClass = "with-sidebar";

        if (this.configuration.settings.themeId) {
            this.theme = await WebAssistant.getTheme(this.spaceId, this.configuration.settings.themeId);
            await applyTheme(this.theme.variables || {}, this.theme.css || '')
        }

        this.chatOptions = IFrameChatOptions;

        this.chatMessages = [];

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
        const hamburgerButton = this.element.querySelector('.hamburger');
        const menuElement = this.element.querySelector('.menu');

        if (hamburgerButton && menuElement) {
            hamburgerButton.addEventListener('click', (event) => {
                event.stopPropagation();
                menuElement.classList.toggle('active');
            });

            document.addEventListener('click', (event) => {
                if (!event.target.closest('.hamburger-container')) {
                    menuElement.classList.remove('active');
                }
            });

            const menuItems = menuElement.querySelectorAll('.preview-sidebar-item');
            menuItems.forEach(item => {
                item.addEventListener('click', (event) => {
                    event.stopPropagation();
                    menuElement.classList.remove('active');
                    const action = item.getAttribute('data-local-action');
                    if (action) {
                        const [actionName, ...params] = action.split(' ');
                        if (this[actionName]) {
                            this[actionName](item, ...params);
                        }
                    }
                });
            });
        }
        const [previewWidgetApp, previewWidgetName] = this.configuration.settings.header.split('/');
        const [previewFooterApp, previewFooterName] = this.configuration.settings.footer.split('/');

        const [widgetApp, widgetName] = this.page.widget.split('/');

        await Promise.all([UI.loadWidget(this.spaceId, previewWidgetApp, previewWidgetName), UI.loadWidget(this.spaceId, widgetApp, widgetName)]);

        UI.createElement(previewWidgetName, '#preview-content-header');
        UI.createElement(previewFooterName, '#preview-content-footer');
        UI.createElement(widgetName, '#preview-content-right', {
            generalSettings: this.page.generalSettings,
            data: this.page.data
        });
        this.previewLeftElement = this.element.querySelector('#preview-content-left');
        this.previewRightElement = this.element.querySelector('#preview-content-right');

        this.previewLeftElement.style.width = `${this.page.chatSize}%`;
        this.previewRightElement.style.width = `${100 - this.page.chatSize}%`;

        if (this.previewRightElement.style.width === '0%') {
            this.previewRightElement.style.display = 'none';
        }
        if (this.previewLeftElement.style.width === '0%') {
            this.previewLeftElement.style.display = 'none';
        }
        this.previewLeftElement.style.width = `${this.page.chatSize}%`;
        this.previewRightElement.style.width = `${100 - this.page.chatSize}%`;
        this.initMobileTabs();

        // Re-init la resize
        window.addEventListener('resize', () => {
            this.initMobileTabs();
        });
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

    async openAssistantMenu(target) {
        this.element.querySelector('.assistant-header-navigation').classList.remove('hidden');
        const closeAssistantMenu = function (event) {
            if (!event.target.closest('.assistant-header-navigation') || event.target.closest('.assistant-header__button')) {
                this.closeAssistantMenu();
                document.removeEventListener("click", closeAssistantMenu);
            }
        }.bind(this);
        document.addEventListener("click", closeAssistantMenu);
    }

    closeAssistantMenu(target) {
        this.element.querySelector('.assistant-header-navigation').classList.add('hidden');
        document.removeEventListener("click", this.closeAssistantMenu.bind(this, target));
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
            const {
                userMessageId,
                responseMessageId
            } = await this.sendQuery(this.spaceId, this.chatId, this.personalityId, userRequestMessage, streamLocationElement)
            element.setAttribute(`id`, userMessageId);
            element.webSkelPresenter.invalidate();
            const responseElement = streamLocationElement.closest('chat-item');
            responseElement.setAttribute(`id`, responseMessageId);
            responseElement.webSkelPresenter.invalidate();
        } else {
            messageId = await sendMessage(this.spaceId, this.chatId, userRequestMessage)
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
                text: "Thinking ...",
                commands: {
                    replay: {
                        role: "assistant",
                        name: this.personalityId
                    }
                }
            }
        )

        const streamContainerHTML = `<chat-item spaceId="${this.spaceId}" role="assistant" ownMessage="false" messageIndex="${this.chatMessages.length - 1}" data-presenter="chat-item" user="${this.personalityId}" data-last-item="true"/>`;
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
        const chatId = await createNewChat(this.spaceId, this.personalityId);
        if (IFrameContext) {
            document.cookie = "chatId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
            document.cookie = `chatId=${chatId}`;
        }
        this.props.chatId = chatId;
        this.invalidate();
    }

    async resetConversation() {
        await resetChat(this.spaceId, this.chatId);
        this.invalidate();
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

    async openPreviewPage(eventTarget, pageId) {
        this.currentPageId = pageId
        this.invalidate();
    }

    initMobileTabs() {
        if (window.innerWidth > 768) return;

        const chatSection = this.element.querySelector('#preview-content-left');
        const pageSection = this.element.querySelector('#preview-content-right');
        const mobileTabs = this.element.querySelector('#mobile-tabs');

        // Verifică dacă ambele secțiuni sunt vizibile
        const chatWidth = parseInt(this.previewLeftElement.style.width) || 0;
        const pageWidth = parseInt(this.previewRightElement.style.width) || 0;

        if (chatWidth === 0 || pageWidth === 0) {
            if (mobileTabs) mobileTabs.classList.add('hidden');
            document.body.classList.add('single-section');

            if (chatWidth > 0) {
                chatSection.classList.add('active');
            } else {
                pageSection.classList.add('active');
            }
            return;
        }

        if (mobileTabs) mobileTabs.classList.remove('hidden');
        document.body.classList.remove('single-section');

        chatSection.classList.add('active');
        pageSection.classList.remove('active');

        const tabs = this.element.querySelectorAll('.mobile-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = tab.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        const chatSection = this.element.querySelector('#preview-content-left');
        const pageSection = this.element.querySelector('#preview-content-right');
        const tabs = this.element.querySelectorAll('.mobile-tab');

        tabs.forEach(tab => tab.classList.remove('active'));
        chatSection.classList.remove('active');
        pageSection.classList.remove('active');

        if (tabName === 'chat') {
            chatSection.classList.add('active');
            tabs[0].classList.add('active');
        } else {
            pageSection.classList.add('active');
            tabs[1].classList.add('active');
        }
    }
}

let ChatPage = BaseChatFrame;
export {ChatPage};

