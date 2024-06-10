export class ChatUnit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.message = this.element.getAttribute("message");
        this.role = this.element.getAttribute("role");
        if (this.role !== "own") {
            this.messageType = "user";
            this.messageTypeBox = "user-box";
            this.user = this.element.getAttribute("user");
            this.imageContainer = `<div class="user-profile-image-container"><img class="user-profile-image" src="${this.role === "assistant" ? assistOS.agent.agentData.image : (this.role === "user" ? `/users/profileImage/${this.user}` : "")}" alt="userImage"></div>`;
        } else {
            this.messageType = "robot";
            this.messageTypeBox = "robot-box";
            this.imageContainer = ``;
        }
    }

    afterRender() {
    }
}