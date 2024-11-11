export class ConfirmActionModal{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){}
    closeModal(){
        assistOS.UI.closeModal(this.element);
    };
    confirmAction(){
        assistOS.UI.closeModal(this.element, true);
    }
}