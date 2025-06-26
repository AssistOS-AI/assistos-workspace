export class EditChatModal {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.chatName = props.chatName || "";
        this.agentId = props.agentId || "";
        this.processId = props.processId || "";
        this.agents = props.agents || [];
        this.processes = props.processes || [];
        this.chatId = props.chatId || null;
        this.invalidate();
    }

    async beforeRender() {
        this.processOptions = this.processes.map(process =>
            `<option value="${process.id}" ${process.id === this.processId ? 'selected' : ''}>${process.name}</option>`
        ).join('');
    }

    async afterRender() {
    }

    closeModal() {
        if (window.assistOS?.UI?.closeModal) {
            window.assistOS.UI.closeModal(this.element);
        }
    }

    saveChat() {
        const nameInput = this.element.querySelector('#chat-name');
        const processSelect = this.element.querySelector('#process-select');

        const chatName = nameInput.value.trim();
        const processId = processSelect.value;

        nameInput.classList.remove('input-invalid');
        processSelect.classList.remove('input-invalid');

        let isValid = true;
        if (!chatName) {
            nameInput.classList.add('input-invalid');
            isValid = false;
        }
        if (!processId) {
            processSelect.classList.add('input-invalid');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        if (window.assistOS?.UI?.closeModal) {
            window.assistOS.UI.closeModal(this.element, {
                chatName,
                processId,
                chatId: this.chatId
            });
        }
    }
}