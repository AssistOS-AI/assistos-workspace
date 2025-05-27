export class VariableValuesTab {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentId = this.element.getAttribute("data-document-id");
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this.document = documentPresenter._document;
        this.element.classList.add("maintain-focus");
        this.varName = this.element.getAttribute("data-name");
        this.variable = documentPresenter.variables.find(variable => variable.varName === this.varName);
        this.invalidate();
    }
    beforeRender() {

    }
    afterRender() {
        let valueInput = this.element.querySelector("#value");
        typeof this.variable.value === "object" ? valueInput.value = JSON.stringify(this.variable.value, null, 2) : valueInput.value = this.variable.value;
        let errorsInput = this.element.querySelector("#errors");
        errorsInput.value = this.variable.errorInfo;
    }
}