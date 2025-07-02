const processModule = assistOS.loadModule("process");

export class DeleteProcessModal {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.processId = element.dataset.processid;
        this.deletedProcess = false;
        this.invalidate();
    }

    async beforeRender() {
    }

    async afterRender() {
    }

    closeModal(target) {
        assistOS.UI.closeModal(target,{deletedProcess:this.deletedProcess});
    }

    async confirmDelete(target) {
        await processModule.deleteProcess(assistOS.space.id, this.processId);
        this.deletedProcess =true;
        this.closeModal(target);
    }
}