const WebAssistant = require("assistos").loadModule("webassistant", assistOS.securityContext);
const chatModule = require("assistos").loadModule("chat", assistOS.securityContext);

const sendMessageActionButtonHTML = `  
<button type="button" id="stopLastStream" class="input__button" data-local-action="chatInputUser">
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
    <list-item data-local-action="uploadFile" data-name="Upload File" data-highlight="light-highlight"></list-item>
    </div>
    <div class="preview-sidebar-item">
    <list-item data-local-action="newChat" data-name="New Room" data-highlight="light-highlight"></list-item>
    </div>
    <div class="preview-sidebar-item">
    <list-item data-local-action="loadChat" data-name="Load Room" data-highlight="light-highlight"></list-item>
    </div>
`

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
        this.chatId = this.props.chatId;
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
        this.personalityId = this.props.personalityId;
        this.spaceId = this.props.spaceId;
        this.userId = this.props.userId;
        this.pageId = this.props.pageId;
        this.webAssistantId = this.props.webAssistantId;

        if (!this.currentPageId) {
            this.configuration = await WebAssistant.getWebAssistant(this.spaceId, this.webAssistantId);
            if (!this.pageId) {
                const homePageConfig = await WebAssistant.getHomePage(this.spaceId, this.webAssistantId);
                this.currentPageId = homePageConfig.id;
            } else {
                this.currentPageId = this.pageId;
            }
        }
        const menu = await WebAssistant.getMenu(this.spaceId, this.webAssistantId);
        this.page = await WebAssistant.getPage(this.spaceId, this.webAssistantId, this.currentPageId);
        this.pageName = this.page.name;
        this.previewContentStateClass = "with-sidebar";

        if (this.configuration.settings.themeId) {
            this.theme = await WebAssistant.getTheme(this.spaceId, this.webAssistantId, this.configuration.settings.themeId);
            await applyTheme(this.theme.variables || {}, this.theme.css || '')
        }
        this.chatActionButton = sendMessageActionButtonHTML
        try{
            this.chatHistory = await chatModule.getChatHistory(this.spaceId, this.chatId);
        }catch(error) {

        }

        const chat = await WebAssistant.getChat(this.spaceId, this.webAssistantId, assistOS.securityContext.userId, this.chatId);
        const controlRoomId = await WebAssistant.getControlRoom(this.spaceId, this.webAssistantId, assistOS.securityContext.userId);
        if(chat.docId === controlRoomId){
            this.controlRoom = true;
        }else{
            this.controlRoom = false;
        }
        this.chatOptions = IFrameChatOptions;
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
        const constants = require("assistos").constants;
        const client = await chatModule.getClient(constants.CHAT_ROOM_PLUGIN, this.spaceId);
        let observableResponse = chatModule.listenForMessages(this.spaceId, this.chatId, client);

        observableResponse.onProgress(async (reply) => {
            if (reply.from === "User") {
                this.chatHistory.push(reply);
                await this.displayUserReply(reply.truid, assistOS.securityContext.email);
                return;
            }
            let existingReply = this.chatHistory.find(msg => msg.truid === reply.truid);
            if (existingReply) {
                let chatItem = this.conversation.querySelector(`chat-item[data-id="${reply.truid}"]`);
                chatItem.webSkelPresenter.updateReply(reply.message);
                return;
            }
            this.chatHistory.push(reply);
            await this.displayAgentReply(reply.truid);
        });
        observableResponse.onError(async (error) => {
            console.error('Error in chat:', error);
            console.log(error.code);
        });

        const pages = await WebAssistant.getPages(this.spaceId, this.webAssistantId);
        if(!this.controlRoom){
            const headerPage = pages.find(page => page.role === "header");
            const footerPage = pages.find(page => page.role === "footer");
            if (headerPage) {
                const [previewWidgetApp, previewWidgetName] = headerPage.widget.split('/');
                await UI.loadWidget(this.spaceId, previewWidgetApp, previewWidgetName);
                UI.createElement(previewWidgetName, '#preview-content-header', {
                    generalSettings: headerPage.generalSettings,
                    data: headerPage.data,
                    html: headerPage.html,
                    css: headerPage.css,
                    js: headerPage.js
                });
            } else {
                this.element.querySelector('#preview-content-header')?.remove();
            }
            if (footerPage) {
                const [previewFooterApp, previewFooterName] = footerPage.widget.split('/');
                await UI.loadWidget(this.spaceId, previewFooterApp, previewFooterName);
                UI.createElement(previewFooterName, '#preview-content-footer',
                    {
                        generalSettings: footerPage.generalSettings,
                        data: footerPage.data,
                        html: footerPage.html,
                        css: footerPage.css,
                        js: footerPage.js
                    });
            } else {
                this.element.querySelector('#preview-content-footer')?.remove();
            }
            const [widgetApp, widgetName] = this.page.widget.split('/');

            await UI.loadWidget(this.spaceId, widgetApp, widgetName);

            UI.createElement(widgetName, '#preview-content-right', {
                generalSettings: this.page.generalSettings,
                data: this.page.data,
                html: this.page.html,
                css: this.page.css,
                js: this.page.js
            });
        }else{
            const loadWidget = pages.find(page => page.role === "load");
            const newWidget = pages.find(page => page.role === "new");

            if(this.loadRoomScope){
                document.getElementById('preview-content-right').innerHTML = '';
                if (loadWidget) {
                    const [loadWidgetApp, loadWidgetName] = loadWidget.widget.split('/');
                    await UI.loadWidget(this.spaceId, loadWidgetApp, loadWidgetName);
                    UI.createElement(loadWidgetName, '#preview-content-right', {
                        generalSettings: loadWidget.generalSettings,
                        data: loadWidget.data,
                        html: loadWidget.html,
                        css: loadWidget.css,
                        js: loadWidget.js
                    },{
                        "data-chat-id": this.chatId,
                        "data-assistant-id": this.webAssistantId,
                        "data-space-id": this.spaceId
                    });
                } else {
                    this.element.querySelector('#preview-content-right')?.remove();
                }
            }else{
                if (newWidget) {
                    const [newWidgetApp, newWidgetName] = newWidget.widget.split('/');
                    await UI.loadWidget(this.spaceId, newWidgetApp, newWidgetName);
                    UI.createElement(newWidgetName, '#preview-content-right', {
                        generalSettings: newWidget.generalSettings,
                        data: newWidget.data,
                        html: newWidget.html,
                        css: newWidget.css,
                        js: newWidget.js
                    },{
                        "data-chat-id": this.chatId,
                        "data-assistant-id": this.webAssistantId,
                        "data-space-id": this.spaceId
                    });
                } else {
                    this.element.querySelector('#preview-content-left')?.remove();
                }
            }
        }



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
        this.initMobileToggle();

        window.addEventListener('resize', () => {
            this.initMobileToggle();
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

    async displayUserReply(replyId, userEmail) {
        const messageHTML = `<chat-item data-id="${replyId}" user-email="${userEmail}" spaceId="${this.spaceId}" ownMessage="true" data-presenter="chat-item" data-last-item="true"></chat-item>`;
        this.conversation.insertAdjacentHTML("beforeend", messageHTML);
        const lastReplyElement = this.conversation.lastElementChild;
        await this.observerElement(lastReplyElement);
        await waitForElement(lastReplyElement, '#done');
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


    getReply(replyId) {
        return this.chatHistory.find(message => message.truid === replyId) || null;
    }

    async displayAgentReply(replyId) {
        const streamContainerHTML = `<chat-item data-id="${replyId}" spaceId="${this.spaceId}" ownMessage="false" data-presenter="chat-item" agent-name="${this.agentName}" data-last-item="true"/>`;
        this.conversation.insertAdjacentHTML("beforeend", streamContainerHTML);
        return await waitForElement(this.conversation.lastElementChild, '#done');
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

    async preventRefreshOnEnter(form, event) {
        if (event.key === "Enter") {
            event.preventDefault();
            if (!event.ctrlKey) {
                await this.chatInputUser(form);
                this.userInput.scrollIntoView({behavior: "smooth", block: "end"});
            } else {
                this.userInput.value += '\n';
                this.userInput.style.height = `${this.userInput.scrollHeight}px`;
            }
        }
    }

    async chatInputUser(_target) {
        let formInfo = await UI.extractFormInformation(_target);
        const userMessage = UI.customTrim(formInfo.data.input)
        formInfo.elements.input.element.value = "";
        if (!userMessage.trim()) {
            return;
        }

        this.chatHistory.push({
            text: userMessage,
            role: "user",
            name: this.userId
        })

        this.userInput.style.height = "auto"
        this.form.style.height = "auto"

        await chatModule.chatInput(this.spaceId, this.chatId, "User", userMessage, "human");
    }


    getMessage(messageIndex) {
        return this.chatHistory[messageIndex]
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

    initMobileToggle() {
        if (window.innerWidth > 768) return;

        const chatSection = this.element.querySelector('#preview-content-left');
        const pageSection = this.element.querySelector('#preview-content-right');
        const toggleContainer = this.element.querySelector('.mobile-toggle-container');
        const toggleSwitch = this.element.querySelector('#mobile-view-toggle');

        const chatWidth = parseInt(this.previewLeftElement.style.width) || 0;
        const pageWidth = parseInt(this.previewRightElement.style.width) || 0;

        if (chatWidth === 0 || pageWidth === 0) {
            if (toggleContainer) toggleContainer.style.display = 'none';
            document.body.classList.add('single-section');

            if (chatWidth > 0) {
                chatSection.classList.add('active');
            } else {
                pageSection.classList.add('active');
            }
            return;
        }

        document.body.classList.remove('single-section');

        chatSection.classList.add('active');
        pageSection.classList.remove('active');
        if (toggleSwitch) toggleSwitch.checked = false;

        if (toggleSwitch && !toggleSwitch.hasAttribute('data-listener-added')) {
            toggleSwitch.setAttribute('data-listener-added', 'true');
            toggleSwitch.addEventListener('change', (e) => {
                if (e.target.checked) {
                    chatSection.classList.remove('active');
                    pageSection.classList.add('active');
                } else {
                    chatSection.classList.add('active');
                    pageSection.classList.remove('active');
                }
            });
        }
    }

    async afterUnload() {
        await chatModule.stopListeningForMessages(this.spaceId, this.chatId);
    }

    async startNewRoom() {
        const chatId = await UI.showModal('create-chat', {
            "assistant-id": this.props.webAssistantId,
            "space-id": this.spaceId
        }, true);
        if (!chatId) {
            return;
        }
        document.cookie = "chatId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        document.cookie = `chatId=${chatId}`;
        await chatModule.stopListeningForMessages(this.spaceId, this.chatId);
        this.element.setAttribute('data-chatId', chatId);
        this.invalidate();
    }

    async loadRoom() {

    }

    async newChat(target) {
        const controlRoomId= await WebAssistant.getControlRoom(this.spaceId, this.webAssistantId, assistOS.securityContext.userId);
        this.loadRoomScope = false;
        await this.openChat(target, controlRoomId);
    }

    async loadChat(target) {
        const controlRoomId= await WebAssistant.getControlRoom(this.spaceId, this.webAssistantId, assistOS.securityContext.userId);
        this.loadRoomScope = true;
        await this.openChat(target, controlRoomId);
    }

    async openChat(button, chatId) {
        document.cookie = "chatId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        document.cookie = `chatId=${chatId}`;
        await chatModule.stopListeningForMessages(this.spaceId, this.chatId);
        this.chatId = chatId;
        this.invalidate();
    }
}

let ChatPage = BaseChatFrame;
export {ChatPage};