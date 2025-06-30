const processModule = assistOS.loadModule("process");
const chatModule = assistOS.loadModule("chat");

export class EditChatModal {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.chatId = element.dataset.chatid
        this.editedChat = false;
        this.invalidate();
    }

    async beforeRender() {
        this.chat = await chatModule.getChat(assistOS.space.id, this.chatId);
        this.chatName = this.chat.docId;
        this.processes = await processModule.getProcesses(assistOS.space.id);
        this.processOptions = this.processes.map(process =>
            `<option value="${process.id}" ${process.id === this.processId ? 'selected' : ''}>${process.name}</option>`
        ).join('');
    }

    async afterRender() {
    }

    closeModal(target) {
        assistOS.UI.closeModal(target, {editedChat: this.editedChat});
    }

    async saveChat(target) {
        const nameInput = this.element.querySelector('#chat-name');
        const processSelect = this.element.querySelector('#process-select');

        const chatName = nameInput.value.trim();
        const processId = processSelect.value;

        try {
            await chatModule.updateChat(assistOS.space.id, {
                id: this.chatId,
                name: chatName,
                processId: parseInt(processId)
            })
            this.editedChat = true;
        } catch (error) {
            console.error(error);
        }
        this.closeModal(target);
    }
}