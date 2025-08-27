import chatUtils from "../../chatUtils.js"
const copyReplyButton = ` <button class="copy-button chat-option-button" data-local-action="copyMessage" data-tooltip="Copy Text"> 
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg" class="icon-md-heavy"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="#000000"></path></svg>
                </button>`;

function decodeHTML(html) {
    let txt = document.createElement("textarea");
    txt.innerHTML = html;
    let decoded = txt.value;
    txt.remove();
    return decoded;
}

export class ChatItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.chatPagePresenter = this.element.closest('chat-room').webSkelPresenter
        this.invalidate();
    }

    async beforeRender() {
        let id = this.element.getAttribute("data-id");
        let reply = this.chatPagePresenter.getReply(id);
        this.actionData = null;
        try {
            let actionMessage = JSON.parse(decodeHTML(reply.message))
            if(!actionMessage.action){
                this.chatMessage = marked.parse(decodeHTML(reply.message));
            } else {
                this.chatMessage = marked.parse(decodeHTML(actionMessage.message));
                this.actionData = actionMessage.action;
            }
        }catch (e) {
            this.chatMessage = marked.parse(decodeHTML(reply.message));
        }

        this.ownMessage = this.element.getAttribute("ownMessage");
        this.userEmail = this.element.getAttribute("user-email");
        let agentName = this.element.getAttribute("agent-name");
        this.id = this.element.getAttribute("data-id");
        this.spaceId = this.element.getAttribute("spaceId");
        this.isContext = this.element.getAttribute("isContext");
        
        this.isExpanded = false;
        this.actionContent = "";
        this.expandToggle = "";
        
        if (this.actionData) {
            let encodedData = assistOS.UI.sanitize(JSON.stringify(this.actionData));
            this.actionContent = `<div class="action-content"><pre>${encodedData}</pre></div>`;
            this.expandToggle = `<div class="expand-toggle" data-local-action="toggleExpand">View More...</div>`;
        }

        if (this.ownMessage === "false") {
            this.messageTypeBox = "others-box";
            let imageSrc = "";
            this.imageContainer = `<div class="user-profile-image-container"><img class="user-profile-image" src="${imageSrc}" alt="userImage"></div>`;
            this.chatBoxOptions = `<div class="chat-options other-message">
                <button class="stop-stream-button chat-option-button" data-local-action="stopResponseStream" data-tooltip="Stop Generating">STOP</button>
                ${copyReplyButton}
            </div>`;
        } else {
            this.ownMessageClass = "user-box-container";
            this.messageTypeBox = "user-box";
            this.imageContainer = ``;
            this.chatBoxOptions = `<div class="chat-options myself-message">
                  ${copyReplyButton}
            </div>`;
        }
    }

    async addToLocalContext(_target) {
        await this.chatPagePresenter.addToLocalContext(this.id, this.element)
    }

    async addToGlobalContext(_target) {
        await this.chatPagePresenter.addToGlobalContext(this)
    }

    async copyMessage(eventTarget) {
        let message = this.element.querySelector(".message").innerText;
        await navigator.clipboard.writeText(message);
    }

    async handleStartStream(endController) {
        this.endStreamController = endController;
        this.stopStreamButton.style.display = "flex";
        await this.chatPagePresenter.handleNewChatStreamedItem(this.messageElement);
    }
    updateReply(message) {
        let messageElement = this.element.querySelector(".message");
        messageElement.innerHTML = marked.parse(decodeHTML(message));
    }

    async handleEndStream() {
        this.stopStreamButton.style.display = "none";
        await this.chatPagePresenter.addressEndStream(this.element);
    }

    async stopResponseStream() {
        this.endStreamController.abort();
        delete this.endStreamController;
        this.stopStreamButton.style.display = "none";
        await this.chatPagePresenter.addressEndStream(this.element);
    }
    
    async toggleExpand() {
        const actionContent = this.element.querySelector(".action-content");
        const expandToggle = this.element.querySelector(".expand-toggle");
        
        if (actionContent && expandToggle) {
            this.isExpanded = !this.isExpanded;
            
            if (this.isExpanded) {
                actionContent.style.display = "block";
                expandToggle.textContent = "View Less...";
            } else {
                actionContent.style.display = "none";
                expandToggle.textContent = "View More...";
            }
        }
    }

    async afterRender() {
        if (this.element.getAttribute('data-last-item') === "true") {
            setTimeout(() => {
                const container = this.element.parentElement;
                container.scrollTo({top: container.scrollHeight, behavior: "instant"});
            }, 100);

        }
        if (this.isContext === "true") {
            this.element.classList.add('context-message')
        }
        if (this.ownMessage) {
            this.stopStreamButton = this.element.querySelector(".stop-stream-button");
        }
        this.chatBoxOptionsElement = this.element.querySelector(".chat-options");
        this.messageElement = this.element.querySelector(".message");
        this.messageElement.addEventListener('mouseenter', () => {
            this.chatBoxOptionsElement.style.display = "flex";
        });
        this.element.addEventListener('mouseleave', () => {
            this.chatBoxOptionsElement.style.display = "none";
        });


        let image = this.element.querySelector(".user-profile-image");
        image?.addEventListener("error", (e) => {
            if(this.userEmail){
                e.target.src = chatUtils.getChatImageURL("./wallet/assets/images/default-user.png")
            } else {
                e.target.src = chatUtils.getChatImageURL("./wallet/assets/images/default-agent.png")
            }
        });
    }

    async afterUnload() {
        if (this.endStreamController) {
            this.endStreamController.abort();
        }
    }
}
