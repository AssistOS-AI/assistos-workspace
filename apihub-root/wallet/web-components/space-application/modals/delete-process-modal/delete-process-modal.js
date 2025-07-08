const processModule = assistOS.loadModule("process");
const WebAssistant = assistOS.loadModule("webassistant", {});

export class DeleteProcessModal {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.processId = element.dataset.processid;
        this.webAssistant = element.dataset.webassistant;
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
        if(this.webAssistant){
            await WebAssistant.deleteScript(assistOS.space.id,this.processId);
        }else{
            await processModule.deleteProcess(assistOS.space.id, this.processId);
        }
        this.deletedProcess =true;
        this.closeModal(target);
    }
}