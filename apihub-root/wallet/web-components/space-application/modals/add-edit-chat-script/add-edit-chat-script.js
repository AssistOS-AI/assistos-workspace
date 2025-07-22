const chatModule = assistOS.loadModule("chat");
const WebAssistant = assistOS.loadModule("webassistant",{});

export class AddEditChatScript {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.spaceId = assistOS.space.id;
        this.assistantId = assistOS.space.webAssistant
        this.scriptId = this.element.dataset.scriptId || null;
        this.invalidate();
    }

    async beforeRender() {
        const pages = await WebAssistant.getPages(this.spaceId,this.assistantId);

        if (this.scriptId) {
            this.chatScript = await WebAssistant.getScript(assistOS.space.id, this.scriptId);
            this.modalTitle = 'Edit Script';
        } else {
            this.modalTitle = 'Add Script';
        }
        this.widgetOptions = pages.map(page => {// TODO selected logic
            return `<option value="${page.id}" ${this.chatScript === page.id?"selected":""} >${page.name}</option>`;
        }).join('');
    }

    async afterRender() {
        this.nameInput = this.element.querySelector('#script-name');
        this.codeInput = this.element.querySelector('#script-code');
        this.descriptionInput = this.element.querySelector('#script-description');
        this.widget = this.element.querySelector('#widget');

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
        const widget = this.widget.value;
        const script = {
            ...(this.scriptId && { id: this.scriptId }),
            name,
            code,
            description,
            ...(widget && { widgetId: widget })
        };
        if (this.scriptId) {
            await  WebAssistant.updateScript(assistOS.space.id,   this.assistantId , this.scriptId, script);
        } else {
            await  WebAssistant.addScript(assistOS.space.id,   this.assistantId , script);
        }
        assistOS.UI.closeModal(target, true);
    }
}