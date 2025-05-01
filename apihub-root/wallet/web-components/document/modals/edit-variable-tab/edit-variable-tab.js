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
        let fullExpression = decodeURIComponent(this.element.getAttribute("data-expression"));
        let splitExpression = fullExpression.split(" ");
        this.command = splitExpression[0];
        this.expression = splitExpression.slice(1).join(" ");
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
    changeExpressionInputToMultiLine(){
        let expressionInput = this.element.querySelector(".expression-input");
        expressionInput.classList.add("hidden");
        expressionInput.name = "";
        expressionInput.id = "";
        let expressionTextarea = this.element.querySelector(".expression-multi-line");
        expressionTextarea.classList.remove("hidden");
        expressionTextarea.name = "expression";
        expressionTextarea.id = "expression";
        let parametersInput = this.element.querySelector(".multi-line-expr-parameters");
        parametersInput.classList.remove("hidden");
    }
    changeMultiLineToSingleLine(){
        let expressionInput = this.element.querySelector(".expression-input");
        expressionInput.classList.remove("hidden");
        expressionInput.name = "expression";
        expressionInput.id = "expression";
        let expressionTextarea = this.element.querySelector(".expression-multi-line");
        expressionTextarea.classList.add("hidden");
        expressionTextarea.name = "";
        expressionTextarea.id = "";
        let parametersInput = this.element.querySelector(".multi-line-expr-parameters");
        parametersInput.classList.remove("hidden");
    }
    afterRender() {

        let commandSelect = this.element.querySelector("#command");
        let selectedOption = commandSelect.querySelector(`option[value="${this.command}"]`);
        if(selectedOption){
            selectedOption.selected = true;
        }
        if(this.command === "macro" || this.command === "jsdef"){
            this.changeExpressionInputToMultiLine();
            let parametersInput = this.element.querySelector("#parameters");
            let splitExpression = this.expression.split(" ");
            let parameters = splitExpression[0].split(",");
            parametersInput.value = parameters.join(" ");
            this.expression = splitExpression.slice(1).join(" ");
        }
        let expressionInput = this.element.querySelector("#expression");
        expressionInput.value = this.expression;
        commandSelect.addEventListener("change", (event) => {
            let value = event.target.value;
            let typeInput = this.element.querySelector(".form-item.type");
            if(value === "new"){
                typeInput.classList.remove("hidden");
            } else {
                typeInput.classList.add("hidden");
            }
            if(value === "macro" || value === "jsdef"){
                this.changeExpressionInputToMultiLine();
            } else {
                this.changeMultiLineToSingleLine();
            }
        });
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
        }else if(command === "assign"){
            command = ":=";
        } else if(command === "macro" || command === "jsdef"){
            let parameters = assistOS.UI.unsanitize(formData.data.parameters);
            expression = `${parameters}\n \t${expression}\n end`;
        }
        expression = `${command} ${expression}`;
        await assistOS.UI.closeModal(this.element, {
            varName: variableName,
            expression: expression,
        });
    }
}