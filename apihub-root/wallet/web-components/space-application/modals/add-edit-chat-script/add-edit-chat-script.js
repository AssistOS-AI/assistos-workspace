const chatModule = assistOS.loadModule("chat");

export class AddEditChatScript {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.scriptId = this.element.dataset.scriptId || null;
        this.invalidate();
    }

    async beforeRender() {
        if (this.scriptId) {
            this.chatScript = await chatModule.getChatScript(assistOS.space.id, this.scriptId);
            this.modalTitle = 'Edit Script';
        } else {
            this.modalTitle = 'Add Script';
        }
    }

    async afterRender() {
        this.nameInput = this.element.querySelector('#script-name');
        this.codeInput = this.element.querySelector('#script-code');
        this.descriptionInput = this.element.querySelector('#script-description');

        if (this.chatScript) {
            this.nameInput.value = this.chatScript.name;
            this.codeInput.value = this.chatScript.code || '';
            this.descriptionInput.value = this.chatScript.description || '';
        }
    }

    closeModal(target) {
        assistOS.UI.closeModal(target);
    }

    async saveScript(target) {
        const name = this.nameInput.value.trim();
        const code = this.codeInput.value.trim();
        const description = this.descriptionInput.value.trim();
        if (this.scriptId) {
            const script = {
                id: this.scriptId,
                name,
                code,
                description
            };
            await chatModule.updateChatScript(assistOS.space.id, this.scriptId, script);
        } else {
            await chatModule.createChatScript(assistOS.space.id, name, code, description);
        }
        assistOS.UI.closeModal(target, true);
    }
}