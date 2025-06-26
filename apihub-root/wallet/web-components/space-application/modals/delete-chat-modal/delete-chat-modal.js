export class DeleteChatModal {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;

        this.chatName = props.chatName || "";
        this.chatId = props.chatId || null;

        this.invalidate();
    }

    async beforeRender() {
    }

    async afterRender() {
    }

    closeModal() {
        if (window.assistOS?.UI?.closeModal) {
            window.assistOS.UI.closeModal(this.element);
        }
    }

    confirmDelete() {
        const deleteData = {
            confirmed: true,
            chatId: this.chatId
        };

        if (window.assistOS?.UI?.closeModal) {
            window.assistOS.UI.closeModal(this.element, deleteData);
        }
    }
}