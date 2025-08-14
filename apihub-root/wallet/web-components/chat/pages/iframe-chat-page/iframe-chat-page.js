const webAssistantModule = require("assistos").loadModule("webassistant", assistOS.securityContext);
const chatModule = require("assistos").loadModule("chat", assistOS.securityContext);
const sendMessageActionButtonHTML = `  
<button type="button" id="stopLastStream" class="input__button" data-local-action="chatInputUser">
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.6 29.1375C6.1 29.3375 5.625 29.2935 5.175 29.0055C4.725 28.7175 4.5 28.299 4.5 27.75V21L16.5 18L4.5 15V8.24996C4.5 7.69996 4.725 7.28146 5.175 6.99446C5.625 6.70746 6.1 6.66346 6.6 6.86246L29.7 16.6125C30.325 16.8875 30.6375 17.35 30.6375 18C30.6375 18.65 30.325 19.1125 29.7 19.3875L6.6 29.1375Z" fill="#8B8B8B"/>
</svg>
</button>
`

let chatOptions = `
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

export class IframeChatPage {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.agentOn = true;
        this.ongoingStreams = new Map();
        this.observedElement = null;
        this.userHasScrolledManually = false;
        this.props = props;
        this.chatId = this.props.chatId;
        this.widgetId = this.props.widgetId;
        this.currentPageId = this.widgetId;
        this.invalidate();
    }

    async beforeRender() {
        this.spaceId = this.props.spaceId;
        this.userId = this.props.userId;

        this.webAssistant = await webAssistantModule.getWebAssistant(this.spaceId);
        if (!this.currentPageId) {
            const homePageConfig = await webAssistantModule.getHomePage(this.spaceId);
            this.currentPageId = homePageConfig.id;
        }
        this.agentName = this.webAssistant.settings.agentId;
        this.widget = await webAssistantModule.getWidget(this.spaceId, this.currentPageId);
        this.widgetName = this.widget.name;

        if (this.webAssistant.settings.themeId) {
            this.theme = await webAssistantModule.getTheme(this.spaceId, this.webAssistant.settings.themeId);
            await applyTheme(this.theme.variables || {}, this.theme.css || '')
        }
        this.chatActionButton = sendMessageActionButtonHTML
        try{
            this.chatHistory = await chatModule.getChatHistory(this.spaceId, this.chatId);
        }catch(error) {

        }

        const chat = await webAssistantModule.getChat(this.spaceId, assistOS.securityContext.userId, this.chatId);
        const controlRoomId = await webAssistantModule.getControlRoom(this.spaceId, assistOS.securityContext.userId);
        this.controlRoom = chat.docId === controlRoomId;
        this.chatOptions = chatOptions;
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
        const pages = await webAssistantModule.getPages(this.spaceId);

        const headerPage = pages.find(page => page.role === "header");
        const footerPage = pages.find(page => page.role === "footer");
        if (headerPage) {
            const [previewWidgetApp, previewWidgetName] = headerPage.widget.split('/');
            await assistOS.UI.loadWidget(this.spaceId, previewWidgetApp, previewWidgetName);
            assistOS.UI.createElement(previewWidgetName, '#preview-content-header', {
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
            await assistOS.UI.loadWidget(this.spaceId, previewFooterApp, previewFooterName);
            assistOS.UI.createElement(previewFooterName, '#preview-content-footer',
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
        //const [widgetApp, widgetName] = this.widget.split('/');

        //await assistOS.UI.loadWidget(this.spaceId, widgetApp, widgetName);

        // assistOS.UI.createElement(widgetName, '#preview-content-right', {
        //     widgetCode: this.widget.code
        // });

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
        this.chatActionButtonContainer = this.element.querySelector("#actionButtonContainer");
        this.maxHeight = 500;
        this.initObservers();
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
        const chatId = await assistOS.UI.showModal('create-chat', {
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
        const controlRoomId= await webAssistantModule.getControlRoom(this.spaceId, assistOS.securityContext.userId);
        this.loadRoomScope = false;
        await this.openChat(target, controlRoomId);
    }

    async loadChat(target) {
        const controlRoomId= await webAssistantModule.getControlRoom(this.spaceId, assistOS.securityContext.userId);
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