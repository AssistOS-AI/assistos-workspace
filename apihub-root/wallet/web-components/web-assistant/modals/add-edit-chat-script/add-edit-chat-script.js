const codeManager = assistOS.loadModule("codemanager");
const chatModule = assistOS.loadModule("chat");
export class AddEditChatScript {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.spaceId = assistOS.space.id;
        this.scriptId = this.element.getAttribute('data-script-id');
        this.invalidate();
    }

    async beforeRender() {
        const widgets = await codeManager.getWidgets(this.spaceId);

        if (this.scriptId) {
            this.chatScript = await chatModule.getChatScript(assistOS.space.id, this.scriptId);
            this.modalTitle = 'Edit Script';
        } else {
            this.modalTitle = 'Add Script';
        }
        this.widgetOptions = widgets.map(page => {
            return `<option value="${page.id}" ${this.chatScript?.widgetId === page.id?"selected":""} >${page.name}</option>`;
        }).join('');
        this.scriptRoleOptions = `
            <option value="guest" ${this.chatScript?.role === 'guest' ? 'selected' : ''}>Guest</option>
            <option value="member" ${this.chatScript?.role === 'member' ? 'selected' : ''}>Member</option>
             <option value="admin" ${this.chatScript?.role === 'admin' ? 'selected' : ''}>Admin</option>
        `
    }

    async afterRender() {
        this.nameInput = this.element.querySelector('#script-name');
        this.codeInput = this.element.querySelector('#script-code');
        this.descriptionInput = this.element.querySelector('#script-description');
        this.widget = this.element.querySelector('#widget');
        this.role = this.element.querySelector('#script-role');

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
        const widgets = this.widget.value;
        const role = this.role.value;

        if (this.scriptId) {
            const script = {
                id: this.scriptId,
                name,
                code,
                role,
                description,
                widgets
            };
            await chatModule.updateChatScript(assistOS.space.id, this.scriptId, script);
        } else {
            await chatModule.createChatScript(assistOS.space.id, name, code, description, widgets, role);
        }
        assistOS.UI.closeModal(target, true);
    }
}