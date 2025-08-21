const webAssistantModule = require("assistos").loadModule("webassistant", assistOS.securityContext);
const chatModule = require("assistos").loadModule("chat", assistOS.securityContext);
const codeManager = require("assistos").loadModule("codemanager", assistOS.securityContext);
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
        this.userEmail = this.props.userEmail;

        this.webAssistant = await webAssistantModule.getWebAssistant(this.spaceId);
        if (!this.currentPageId) {
            this.contextPage = {
                name: "home-widget",
                code: `<div>Home Widget</div>`
            }
        } else {
            this.contextPage = await webAssistantModule.getWidget(this.spaceId, this.currentPageId);
            this.widgetName = this.contextPage.name;
        }

        if (this.webAssistant.themeId) {
            this.theme = await webAssistantModule.getTheme(this.spaceId, this.webAssistant.themeId);
            await applyTheme(this.theme.variables || {}, this.theme.css || '')
        }
        this.chatActionButton = sendMessageActionButtonHTML
        try{
            this.chatHistory = await chatModule.getChatHistory(this.spaceId, this.chatId);
        }catch(error) {
            console.error(error);
        }

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
        if (this.webAssistant.header) {
            const [appName, widgetId] = this.webAssistant.header.split('/');
            let widget = await codeManager.getWidget(this.spaceId, appName, widgetId);
            assistOS.UI.createElement("widget-container", '#chat-header', {
                code: widget.data,
            });
        } else {
            this.element.querySelector('#chat-header')?.remove();
        }
        if (this.webAssistant.footer) {
            const [appName, widgetId] = this.webAssistant.footer.split('/');
            let widget = await codeManager.getWidget(this.spaceId, appName, widgetId);
            assistOS.UI.createElement("widget-container", '#chat-footer',
                {
                    code: widget.data
                });
        } else {
            this.element.querySelector('#chat-footer')?.remove();
        }

        assistOS.UI.createElement("widget-container", '#context-container', {
            code: this.widget.code
        });

        this.previewLeftElement = this.element.querySelector('#preview-content-left');
        this.previewRightElement = this.element.querySelector('#context-container');

        this.previewLeftElement.style.width = `50%`;
        this.previewRightElement.style.width = `50%`;

        if (this.previewRightElement.style.width === '0%') {
            this.previewRightElement.style.display = 'none';
        }
        if (this.previewLeftElement.style.width === '0%') {
            this.previewLeftElement.style.display = 'none';
        }
        this.initMobileToggle();

        window.addEventListener('resize', () => {
            this.initMobileToggle();
        });
        this.conversation = this.element.querySelector(".conversation");
        this.chatActionButtonContainer = this.element.querySelector("#actionButtonContainer");
        this.maxHeight = 500;
    }
    async openWidget(targetElement, widgetName){
        let widget = await codeManager.getWidget(this.spaceId, widgetName);
        let contextContainer = this.element.querySelector('#context-container');
        contextContainer.innerHTML = "";
        assistOS.UI.createElement("widget-container", '#context-container', {
            code: widget
        });
    }
    initMobileToggle() {
        if (window.innerWidth > 768) return;

        const chatSection = this.element.querySelector('#preview-content-left');
        const pageSection = this.element.querySelector('#context-container');
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

    async openChat(button, chatId) {
        document.cookie = "chatId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        document.cookie = `chatId=${chatId}`;
        await chatModule.stopListeningForMessages(this.spaceId, this.chatId);
        this.chatId = chatId;
        this.invalidate();
    }
}