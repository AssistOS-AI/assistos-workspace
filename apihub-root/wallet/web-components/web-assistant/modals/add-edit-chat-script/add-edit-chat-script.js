const chatModule = assistOS.loadModule("chat");
const WebAssistant = assistOS.loadModule("webassistant",{});

export class AddEditChatScript {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.spaceId = assistOS.space.id;
        this.assistantId = assistOS.space.webAssistant
        this.addedProcess =false;
        this.changedProcess = false;
        this.scriptId = this.element.dataset.processid || null;
        this.invalidate();
    }

    async beforeRender() {
        const pages = await WebAssistant.getPages(this.spaceId,this.assistantId);

        if (this.scriptId) {
            this.chatScript = await WebAssistant.getScript(assistOS.space.id,this.assistantId, this.scriptId);
            this.modalTitle = 'Edit Script';
        } else {
            this.modalTitle = 'Add Script';
        }
        this.widgetOptions = pages.map(page => {
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
        assistOS.UI.closeModal(target,{
            changedProcess: this.changedProcess ,
            addedProcess: this.addedProcess
        });
    }

    async saveScript(target) {
        const name = this.nameInput.value.trim();
        const code = this.codeInput.value.trim();
        const description = this.descriptionInput.value.trim();
        const widget = this.widget.value;
        const role = this.role.value;
        const script = {
            ...(this.scriptId && { id: this.scriptId }),
            name,
            code,
            role,
            description,
            ...(widget && { widgetId: widget })
        };
        if (this.scriptId) {
            await  WebAssistant.updateScript(assistOS.space.id,   this.assistantId , this.scriptId, script);
            this.changedProcess = true;
        } else {
            await  WebAssistant.addScript(assistOS.space.id,   this.assistantId , script);
            this.addedProcess = true;
        }
        assistOS.UI.closeModal(target);
    }
}