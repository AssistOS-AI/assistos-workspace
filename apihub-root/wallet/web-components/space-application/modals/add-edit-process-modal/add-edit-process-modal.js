const processModule = assistOS.loadModule("process");

export class AddEditProcessModal {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.processId = this.element.dataset.processid || null;
        this.invalidate();
    }

    async beforeRender() {
        if (this.processId) {
            this.process = await processModule.getProcess(assistOS.space.id, this.processId);
        } else {
            this.addedProcess = false;
        }
    }

    async afterRender() {
        this.processNameInput = this.element.querySelector('#process-name');
        this.processSoplangInput = this.element.querySelector('#process-soplang');
        this.processDescriptionInput = this.element.querySelector('#process-description');

        if (this.process) {
            this.processNameInput.value = this.process.name;
            this.processSoplangInput.value = this.process.soplang || '';
            this.processDescriptionInput.value = this.process.description || '';
        }
    }

    closeModal(target) {
        assistOS.UI.closeModal(target, {addedProcess: this.addedProcess, changedProcess: this.changedProcess});
    }

    async saveProcess(target) {
        const name = this.processNameInput.value.trim();
        const soplang = this.processSoplangInput.value.trim();
        const description = this.processDescriptionInput.value.trim();
        debugger
        if (this.processId) {
            const processData = {
                id: this.processId,
                name,
                soplang,
                description
            };
            await processModule.updateProcess(assistOS.space.id, this.processId, processData);
            this.changedProcess = true;
            this.closeModal(target);
        } else {
            await processModule.addProcess(assistOS.space.id, {
                name,
                soplang,
                description
            });
            this.addedProcess = true;
            this.closeModal(target);
        }
    }
}