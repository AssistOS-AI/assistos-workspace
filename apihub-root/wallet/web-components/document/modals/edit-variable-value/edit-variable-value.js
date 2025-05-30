export class EditVariableValue {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let varName = this.element.getAttribute('data-var-name');
        let docViewPage = document.querySelector("document-view-page");
        if(docViewPage) {
            let documentPresenter = docViewPage.webSkelPresenter;
            this.variable = documentPresenter.variables.find(v => v.varName === varName);
        } else {
            let varsTab = document.querySelector("variables-tab");
            let varsTabPresenter = varsTab.webSkelPresenter;
            this.variable = varsTabPresenter.variables.find(v => v.varName === varName);
        }

        this.element.classList.add("maintain-focus");
        this.invalidate();
    }

    async beforeRender() {
    }

    async afterRender(){
        if(this.variable.parsedCommand.command === "assign"){
            let textAreaItem = this.element.querySelector('.textarea');
            textAreaItem.classList.remove('hidden');
            let textarea = this.element.querySelector('#value');
            textarea.value = this.variable.parsedCommand.value || "";
            textarea.addEventListener("input",(e) => {
                let value = e.target.value;
                let saveButton = this.element.querySelector('.general-button');
                if(value.trim() === ""){
                    saveButton.classList.add("disabled");
                } else {
                    saveButton.classList.remove("disabled");
                }
            })
        }
    }
    saveVarValue(targetElement) {
        let varValue;
        if(this.variable.parsedCommand.command === "assign"){
            varValue = this.element.querySelector('#value').value;
        }
        assistOS.UI.closeModal(this.element, varValue);
    }
    closeModal(){
        assistOS.UI.closeModal(this.element);
    }
}