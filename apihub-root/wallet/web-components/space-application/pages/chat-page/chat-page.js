const IFrameContext = window.assistOS === undefined;
const UI = IFrameContext ? window.UI : window.assistOS.UI
import {BaseChatFrame} from "./BaseChatFrame.js";
import chatUtils from "./chatUtils.js";
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
            this.chatOptions = chatUtils.chatOptions;
            this.toggleAgentResponseButton = `
                <button type="button" id="toggleAgentResponse" class="${this.agentOn ? "agent-on" : "agent-off"}"
                        data-local-action="toggleAgentResponse">${this.agentOn ? "Agent:ON" : "Agent:OFF"}</button>`;
            this.checked = this.agentOn ? "checked" : "";
        }

        async afterRender() {
            await super.afterRender()
            const agentToggleCheckbox = this.element.querySelector('#chat-toggle')
            agentToggleCheckbox.addEventListener('change', this.toggleAgentResponse.bind(this));
            let chatState = localStorage.getItem("chatState");
            if (chatState === "minimized") {
                await this.toggleMinimizeScreen();
            } else if (chatState === "half") {
                await this.toggleHalfScreen();
            } else if (chatState === "third") {
                await this.toggleThirdScreen();
            } else {
                await this.toggleFullScreen();
            }
        }

        setSpaceContainer() {
            if (!this.spaceContainer) {
                this.spaceContainer = document.getElementById("space-page-container");
            }
            return this.spaceContainer;
        }

        toggleFullScreen(_target) {
            this.setSpaceContainer();
            const agentPage = this.element;
            agentPage.style.display = "flex";
            agentPage.style.width = "calc(100vw - 70px)";
            agentPage.style.minWidth = "calc(100vw - 70px)";
            this.spaceContainer.style.display = "none";
            localStorage.setItem("chatState", "full");
        }

        toggleHalfScreen(_target) {
            this.setSpaceContainer();
            const agentPage = this.element;
            agentPage.style.display = "flex";
            this.spaceContainer.style.display = "flex";
            agentPage.style.width = "calc(50vw - 37.5px)";
            agentPage.style.minWidth = "calc(50vw - 37.5px)";
            this.spaceContainer.style.width = "calc(50vw - 37.5px)";
            this.spaceContainer.style.minWidth = "calc(50vw - 37.5px)";
            localStorage.setItem("chatState", "half");
        }

        toggleThirdScreen(_target) {
            this.setSpaceContainer();
            const agentPage = this.element;
            agentPage.style.display = "flex";
            this.spaceContainer.style.display = "flex";
            agentPage.style.width = "calc(30vw - 37.5px)";
            agentPage.style.minWidth = "calc(30vw - 37.5px)";
            this.spaceContainer.style.width = "calc(70vw - 37.5px)";
            this.spaceContainer.style.minWidth = "calc(70vw - 37.5px)";
            localStorage.setItem("chatState", "third");
        }

        toggleMinimizeScreen(_target) {
            this.setSpaceContainer();
            const agentPage = this.element
            UI.chatState = "minimized";
            agentPage.style.display = "none";
            agentPage.style.width = "0px";
            agentPage.style.minWidth = "0px";
            this.spaceContainer.style.display = "flex";
            this.spaceContainer.style.width = "calc(100vw - 70px)";
            this.spaceContainer.style.minWidth = "calc(100vw - 70px)";
            if (localStorage.getItem("chatState") === "minimized") {
                return;
            }
            localStorage.setItem("previousChatState", localStorage.getItem("chatState"));
            localStorage.setItem("chatState", "minimized");
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

