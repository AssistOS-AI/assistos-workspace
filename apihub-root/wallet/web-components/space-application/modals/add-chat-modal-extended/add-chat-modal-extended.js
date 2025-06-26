export class AddChatModalExtended {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.agents = props.agents || [];
        this.processes = props.processes || [];
        this.invalidate();
    }

    async beforeRender() {
        this.agentOptions = this.agents.map(agent =>
            `<option value="${agent.id}">${agent.name}</option>`
        ).join('');

        this.processOptions = this.processes.map(process =>
            `<option value="${process.id}">${process.name}</option>`
        ).join('');
    }

    async afterRender() {
        const nameInput = this.element.querySelector('#chat-name');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 100);
        }
    }

    closeModal() {
        if (window.assistOS?.UI?.closeModal) {
            window.assistOS.UI.closeModal(this.element);
        }
    }

    saveChat() {
        const nameInput = this.element.querySelector('#chat-name');
        const agentSelect = this.element.querySelector('#agent-select');
        const processSelect = this.element.querySelector('#process-select');

        const chatName = nameInput.value.trim();
        const agentId = agentSelect.value;
        const processId = processSelect.value;

        nameInput.classList.remove('input-invalid');
        agentSelect.classList.remove('input-invalid');
        processSelect.classList.remove('input-invalid');

        let isValid = true;
        if (!chatName) {
            nameInput.classList.add('input-invalid');
            isValid = false;
        }
        if (!agentId) {
            agentSelect.classList.add('input-invalid');
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
                agentId,
                processId
            });
        }
    }
}