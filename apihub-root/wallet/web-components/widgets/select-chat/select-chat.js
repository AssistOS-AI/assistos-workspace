const WebAssistant = require("assistos").loadModule("webassistant", assistOS.securityContext);

export class SelectChat {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.chatId = this.element.getAttribute("data-chat-id");
        this.assistantId = this.element.getAttribute("data-assistant-id")
        this.userId = assistOS.securityContext.userId;
        this.spaceId = this.element.getAttribute("data-space-id");
        this.invalidate();
    }

    async beforeRender() {
        let chats = await WebAssistant.getUserChats(this.spaceId, this.assistantId,this.userId);
        this.chatsHTML = "";
        for (let chat of chats) {
            let selectedClass = "";
            let dataLocalAction = `data-local-action="selectChat ${chat}"`;
            if (this.chatId === chat) {
                selectedClass = "selected";
                dataLocalAction = "";
            }
            this.chatsHTML += `<div class="chat-item ${selectedClass}" data-local-action="selectChat ${chat}">${chat}</div>`;
        }
    }

    afterRender() {

    }

    closeModal(_target) {
    }

    async selectChat(_target, chatId) {
        document.querySelector("chat-page")?.webSkelPresenter?.openChat(null, chatId);
        this.element.remove();
    }
}
