const chatModule = assistOS.loadModule("chat");
export class SelectChat {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.chatId = this.element.getAttribute("data-chat-id");
        this.invalidate();
    }

    async beforeRender() {
        let chats = await chatModule.getChats(assistOS.space.id);
        this.chatsHTML = "";
        for(let chat of chats) {
            let selectedClass = "";
            let dataLocalAction = `data-local-action="selectChat ${chat.docId}"`;
            if (this.chatId === chat.docId) {
                selectedClass = "selected";
                dataLocalAction = "";
            }
            this.chatsHTML += `<div class="chat-item ${selectedClass}" ${dataLocalAction}>${chat.title}</div>`;
        }
    }

    afterRender() {

    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async selectChat(_target, chatId) {
        assistOS.UI.closeModal(_target, chatId);
    }
}
