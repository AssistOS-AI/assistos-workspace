const spaceModule = require("assistos").loadModule("space", {});
export class ChatItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    async beforeRender() {
        this.message = assistOS.UI.sanitize(this.element.getAttribute("message"));
        this.role = this.element.getAttribute("role");
        if (this.role !== "own") {
            this.messageType = "user";
            this.messageTypeBox = "user-box";
            this.user = this.element.getAttribute("user");
            let assistantImgSrc;
            if(this.role === "assistant"){
                assistantImgSrc = await spaceModule.getImageURL(assistOS.agent.agentData.imageId);
            }
            this.imageContainer = `<div class="user-profile-image-container"><img class="user-profile-image" src="${this.role === "assistant" ? assistantImgSrc : (this.role === "user" ? `/users/profileImage/${this.user}` : "")}" alt="userImage"></div>`;
        } else {
            this.messageType = "robot";
            this.messageTypeBox = "robot-box";
            this.imageContainer = ``;
        }
    }

    afterRender() {
    }
}
