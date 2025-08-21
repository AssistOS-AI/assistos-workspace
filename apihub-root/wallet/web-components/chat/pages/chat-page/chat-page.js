import chatUtils from "../../chatUtils.js";
export class ChatPage {
    constructor(element, invalidate) {
        const agentState = localStorage.getItem("agentOn");
        this.element = element;
        this.invalidate = invalidate;
        if (!agentState) {
            localStorage.setItem("agentOn", "true");
            this.agentOn = true;
        } else {
            this.agentOn = agentState === "true";
        }
        this.invalidate();
    }

    async beforeRender() {
        this.chatOptions = chatUtils.chatOptions;
        this.toggleAgentResponseButton = `
            <button type="button" id="toggleAgentResponse" class="${this.agentOn ? "agent-on" : "agent-off"}"
                    data-local-action="toggleAgentResponse">${this.agentOn ? "Agent:ON" : "Agent:OFF"}</button>`;
        this.checked = this.agentOn ? "checked" : "";
        this.chatId = assistOS.space.currentChatId;
        this.spaceId = assistOS.space.id;
        this.userEmail = assistOS.user.email;
    }

    async afterRender() {
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

    async toggleAgentResponse(_target) {
        this.agentOn = !this.agentOn;
        localStorage.setItem("agentOn", this.agentOn);
    }

    uploadFile(_target) {
        let fileInput = this.element.querySelector(".file-input");
        fileInput.click();
    }
    async openContextPage(targetElement, componentName, appName){
        if(componentName === "create-chat" || componentName === "load-chat"){
            let chatId = await assistOS.UI.showModal(componentName, {}, true);
            if(chatId){
                assistOS.space.currentChatId = chatId;
                this.invalidate();
                return;
            }
        } else {
            if(appName){

            } else {
                let sidebarPresenter = document.querySelector("left-sidebar").webSkelPresenter;
                await sidebarPresenter.navigateToPage("", componentName);
            }
        }
    }
}

