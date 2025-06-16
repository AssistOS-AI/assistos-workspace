let userModule = assistOS.loadModule("user");
export class CreateTicket {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    async beforeRender() {

    }
    afterRender() {

    }
    async submitTicket(){
        let form = this.element.querySelector('form');
        let formInfo = await assistOS.UI.extractFormInformation(form);
        if(!formInfo.isValid){
            return;
        }
        await userModule.createTicket(assistOS.user.email, formInfo.data.subject, formInfo.data.message);
        assistOS.UI.closeModal(this.element);
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
}