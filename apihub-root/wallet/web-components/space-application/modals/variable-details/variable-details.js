export class VariableDetails {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.id = this.element.getAttribute('data-variable-id');
        let variablesTab = document.querySelector("variables-tab");
        this.variable = variablesTab.webSkelPresenter.getVariable(this.id);
        this.invalidate();
    }
    beforeRender() {
        this.variableDetails = JSON.stringify(this.variable, null, 2);
    }
    afterRender() {
    }


    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
}