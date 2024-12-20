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
        } else {
            this.messageType = "robot";
            this.messageTypeBox = "robot-box";
            this.imageContainer = ``;
        }
    }

    afterRender() {
    }
}
