const chatModule = assistOS.loadModule("chat");

export class DeleteChatModal {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.chatId = element.dataset.chatid;
        this.chatDeleted=false;
        this.invalidate();
    }

    async beforeRender() {
        this.chat = await chatModule.getChat(assistOS.space.id, this.chatId);
        this.chatName = this.chat.docId;
    }

    async afterRender() {

    }
    closeModal(target) {
        assistOS.UI.closeModal(target, {editedChat: this.chatDeleted});
    }
    async confirmDelete(target) {
        try {
            await chatModule.deleteChat(assistOS.space.id, this.chatId)
            this.chatDeleted=true;
        }catch(error){
            console.error(error);
        }finally{
            this.closeModal(target);
        }
    }
}