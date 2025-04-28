export class EditBasicVariable {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentId = this.element.getAttribute("data-document-id");
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this.document = documentPresenter._document;
        this.element.classList.add("maintain-focus");
        this.varName = this.element.getAttribute("data-name");
        this.expression = decodeURIComponent(this.element.getAttribute("data-expression"));
        this.invalidate();
    }

    beforeRender(){

    }

    afterRender(){
        let valueInput = this.element.querySelector("#command");
        valueInput.value = this.expression;
    }
    async editVariable(targetElement){
        let formData = await assistOS.UI.extractFormInformation(targetElement);
        if(!formData.isValid){
            return;
        }
        let variableName = formData.data.name;
        let command = formData.data.command;
        await assistOS.UI.closeModal(this.element, {
            varName: variableName,
            expression: command,
        });
    }
    closeModal(){
        assistOS.UI.closeModal(this.element)
    }
}
