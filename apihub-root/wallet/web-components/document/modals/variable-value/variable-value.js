export class VariableValue {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.element.classList.add("maintain-focus");
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        let varName = this.element.getAttribute("data-var-name");
        this._document = documentPresenter._document;
        this.variable = documentPresenter.variables.find(variable => variable.varName === varName);
        this.invalidate();
    }
    async beforeRender() {
        this.variableValue = this.variable.value || "No value set";
    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }


}