const spaceModule = require("assistos").loadModule("space", {});

export class EditVariableTab {
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

    async beforeRender() {
        let commands = await spaceModule.getCommands(assistOS.space.id);
        let variableCommandOptions = "";
        for(let command of commands){
            variableCommandOptions += `<option value="${command}">${command}</option>`;
        }
        this.variableCommandOptions = variableCommandOptions;

        let types = await spaceModule.getCustomTypes(assistOS.space.id);
        let variableTypeOptions = `<option value="" selected disabled>Select Type</option>`;
        for(let type of types){
            variableTypeOptions += `<option value="${type}">${type}</option>`;
        }
        this.variableTypeOptions = variableTypeOptions;
    }

    afterRender() {
        let expressionInput = this.element.querySelector("#expression");
        expressionInput.value = this.expression;
        let commandSelect = this.element.querySelector("#command");
        commandSelect.addEventListener("change", (event) => {
            let value = event.target.value;
            let typeInput = this.element.querySelector(".form-item.type");
            if(value === "new"){
                typeInput.classList.remove("hidden");
            } else {
                typeInput.classList.add("hidden");
            }
            if(value === "macro" || value === "jsdef"){
                let expressionInput = this.element.querySelector(".expression-input");
                expressionInput.classList.add("hidden");
                expressionInput.name = "";
                expressionInput.id = "";
                let expressionTextarea = this.element.querySelector(".expression-multi-line");
                expressionTextarea.classList.remove("hidden");
                expressionTextarea.name = "expression";
                expressionTextarea.id = "expression";
            } else {
                let expressionInput = this.element.querySelector(".expression-input");
                expressionInput.classList.remove("hidden");
                expressionInput.name = "expression";
                expressionInput.id = "expression";
                let expressionTextarea = this.element.querySelector(".expression-multi-line");
                expressionTextarea.classList.add("hidden");
                expressionTextarea.name = "";
                expressionTextarea.id = "";
            }
        });
        let typeSelect = this.element.querySelector("#type");
        typeSelect.addEventListener("change", (event) => {
            let value = event.target.value;
            let columnsInput = this.element.querySelector(".form-item.columns");
            let expressionFormItem = this.element.querySelector(".form-item.expression");
            if(value === "Table"){
                expressionFormItem.classList.add("hidden");
                let expressionInput = this.element.querySelector("#expression");
                expressionInput.value = "";
                columnsInput.classList.remove("hidden");
            } else {
                expressionFormItem.classList.remove("hidden");
                columnsInput.classList.add("hidden");
            }
        })
    }
    async editVariable(targetElement){
        let formData = await assistOS.UI.extractFormInformation(targetElement);
        if(!formData.isValid){
            return;
        }
        let variableName = formData.data.name;
        let command = formData.data.command;
        let expression = formData.data.expression;
        expression = assistOS.UI.unsanitize(expression);

        if(command === "new"){
            let variableType = formData.data.type;
            if(!variableType){
                return alert("Please select a type");
            }
            expression += `${variableType} `;
            if(variableType === "Table"){
                formData.data.columns = parseInt(formData.data.columns);
                for(let i = 0; i < formData.data.columns; i++){
                    expression += `c${i} `;
                }
            }
        }
        if(command === "assign"){
            command = ":=";
        }
        expression = `${command} ${expression}`;
        await assistOS.UI.closeModal(this.element, {
            varName: variableName,
            expression: expression,
        });
    }
}