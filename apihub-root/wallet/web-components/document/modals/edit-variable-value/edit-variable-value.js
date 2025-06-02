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
        let parsedCommand = this.variable.parsedCommand;
        if(parsedCommand.command === "assign"){
            let textAreaItem = this.element.querySelector('.textarea');
            textAreaItem.classList.remove('hidden');
            let textarea = this.element.querySelector('#value');
            textarea.value = parsedCommand.value || "";
            textarea.addEventListener("input",(e) => {
                let value = e.target.value;
                let saveButton = this.element.querySelector('.general-button');
                if(value.trim() === ""){
                    saveButton.classList.add("disabled");
                } else {
                    saveButton.classList.remove("disabled");
                }
            })
        } else if(parsedCommand.command === "new"){
            let inputVars = parsedCommand.inputVars;
            if(inputVars[0] === "Table"){
                let columnsHTML = "";
                for(let i = 1; i < inputVars.length; i++){
                    columnsHTML+= `<div class="cell">${inputVars[i]}</div>`;
                }
                let table = document.createElement("div", );
                table.classList.add("table");
                table.style.display = "grid";
                table.style.gridTemplateColumns = `repeat(${inputVars.length - 1}, 1fr)`;
                table.innerHTML = columnsHTML;
                let tableContainer = this.element.querySelector('.table-container');
                tableContainer.insertAdjacentElement("afterbegin", table);
            }
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