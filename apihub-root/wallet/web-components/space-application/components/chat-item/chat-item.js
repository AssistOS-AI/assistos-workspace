const spaceModule = require("assistos").loadModule("space", {});
const userModule = require("assistos").loadModule("user", {});

export class ChatItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    async beforeRender() {
        this.message = assistOS.UI.sanitize(this.element.getAttribute("message"));
        this.role = this.element.getAttribute("role");
        // own = message sent by "myself"

        if (this.role !== "own") {
            this.messageType = "user";
            this.messageTypeBox = "user-box";
            this.user = this.element.getAttribute("user");
            let imageSrc = "";
            if(this.role === "user"){
                try {
                    imageSrc = await userModule.getUserProfileImage(this.user);
                } catch (error) {
                    imageSrc = "./wallet/assets/images/default-personality.png";
                }
            } else if(this.role === "assistant"){
                try {
                    imageSrc = await spaceModule.getImageURL(assistOS.agent.agentData.imageId);
                } catch (e) {
                    imageSrc = "./wallet/assets/images/default-personality.png";
                }
            } else {
                imageSrc = "./wallet/assets/images/default-personality.png";
            }
            this.imageContainer = `<div class="user-profile-image-container"><img class="user-profile-image" src="${imageSrc}" alt="userImage"></div>`;
            this.chatBoxOptions = `<div class="chat-options other-message">
                <button class="stop-stream-button chat-option-button" data-local-action="stopResponseStream">STOP</button>
                <button class="copy-button chat-option-button" data-local-action="copyMessage"> 
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-md-heavy"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="currentColor"></path></svg>
                </button>
                <button class="chat-option-button">Add</button>
            </div>`
        } else {
            /* message was sent by myself */
            this.messageType = "robot";
            this.messageTypeBox = "robot-box";
            this.imageContainer = ``;

            this.chatBoxOptions = `<div class="chat-options myself-message">
                  <button class="copy-button chat-option-button" data-local-action="copyMessage"> 
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-md-heavy"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="currentColor"></path></svg>
                </button>
                <button class="chat-option-button">Add</button>
                <button class="chat-option-button">Memo</button>
            </div>`
        }
    }
    async copyMessage(eventTarget){
        let message = this.element.querySelector(".message").innerText;
        await navigator.clipboard.writeText(message);
    }

    async handleStartStream(endController){
        this.endStreamController = endController;
        this.stopStreamButton.style.display = "flex";
    }

    async handleEndStream(){
        this.stopStreamButton.style.display = "none";
    }

    async stopResponseStream(){
        this.endStreamController.abort();
        delete this.endStreamController;
        this.stopStreamButton.style.display = "none";
    }

    async afterRender() {
        if (this.element.getAttribute('data-last-item') === "true") {
            setTimeout(()=>{
                this.element.scrollIntoView({ behavior: "instant", block: "end", inline: "end" });
                const container = this.element.parentElement;
                container.scrollTop += 20;
            },100)
        }
        if (this.role !== "own") {
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
            e.target.src = "./wallet/assets/images/default-personality.png";
        });
    }
    async afterUnload(){
        if(this.endStreamController){
            this.endStreamController.abort();
        }
    }
}
