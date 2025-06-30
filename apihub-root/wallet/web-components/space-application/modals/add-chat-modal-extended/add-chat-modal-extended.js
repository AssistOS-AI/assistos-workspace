const processModule = assistOS.loadModule("process");
const chatModule = assistOS.loadModule("chat");

export class AddChatModalExtended {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.addedChat = false;
        this.invalidate();
    }

    async beforeRender() {
        this.processes = await processModule.getProcesses(assistOS.space.id);
        this.processOptions = this.processes.map(process =>
            `<option value="${process.id}">${process.name}</option>`
        ).join('');
    }

    async afterRender() {
        const nameInput = this.element.querySelector('#chat-name');
        nameInput.focus();
    }

    closeModal(target) {
        assistOS.UI.closeModal(target, {editedChat: this.addedChat});
    }

    async saveChat(target) {
        const nameInput = this.element.querySelector('#chat-name');
        const processSelect = this.element.querySelector('#process-select');

        const name = nameInput.value.trim();
        const processId = processSelect.value;
        try {
            await chatModule.createChat(assistOS.space.id,
                name,
                processId,
                "USER",
                "AGENT"
            )
            this.addedChat = true;
        } catch (error) {
            console.error(error);
        } finally {
            this.closeModal(target);
        }
    }
}