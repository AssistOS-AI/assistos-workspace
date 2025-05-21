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
        this.expression = this.element.getAttribute("data-expression");
        this.command = this.element.getAttribute("data-command");
        this.invalidate();
    }

    async beforeRender() {
        this.commands = await spaceModule.getCommands(assistOS.space.id);
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
        parametersInput.classList.add("hidden");
    }
    /*search select*/
    openSearchSelect(){
        let selectOptions = this.element.querySelector(".select-options");
        if(!selectOptions.classList.contains("hidden")){
            return;
        }
        this.renderSelectOptions(selectOptions, this.commands);
        let commandInput = this.element.querySelector("#command");
        let currentValue = commandInput.value;
        selectOptions.classList.remove("hidden");
        this.controller = new AbortController();
        let selectedOption = selectOptions.querySelector(`.option[data-value="${currentValue}"]`);
        if(selectedOption){
            selectedOption.classList.add("selected");
        }
        let boundCloseSearchSelect = this.closeSearchSelect.bind(this, selectOptions);
        document.addEventListener("click", boundCloseSearchSelect, {signal: this.controller.signal});
    }
    closeSearchSelect(selectOptions, event){
        if(!event.target.closest(".search-select-input")){
            selectOptions.innerHTML = "";
            selectOptions.classList.add("hidden");
            this.controller.abort();
        }
    }
    renderSelectOptions(selectOptions, commands){
        let variableCommandOptions = "";
        for(let command of commands){
            variableCommandOptions += `<div class="option" data-local-action="selectOption" data-value="${command}">${command}</div>`;
        }
        selectOptions.innerHTML = variableCommandOptions;
    }
    selectOption(option){
        let value = option.getAttribute("data-value");
        let searchSelect = option.closest(".search-select");
        let input = searchSelect.querySelector("input");
        input.value = value;
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
    }
    /*search select*/
    insertTypeSelect(types, defaultSelected){
        assistOS.UI.createElement("custom-select", ".select-type-container", {
                options: types,
            },
            {
                "data-width": "230",
                "data-name": "type",
                "data-selected": defaultSelected,
            })
    }
    async afterRender() {

        let types = await spaceModule.getCustomTypes(assistOS.space.id);
        let variableTypeOptions = [{name: "Select a type", value: ""}];
        for(let type of types){
            variableTypeOptions.push({
                name: type,
                value: type
            })
        }

        let commandInput = this.element.querySelector("#command");
        let selectOptions = this.element.querySelector(".select-options");
        if(this.command === ":="){
            this.command = "assign";
        }
        commandInput.value = this.command;
        commandInput.addEventListener("input", (event) => {
            let value = event.target.value;
            let foundCommands = this.commands.filter(command => command.toLowerCase().includes(value.toLowerCase()));
            if(foundCommands.length === 0){
                commandInput.setAttribute("data-valid", false);
            } else {
                commandInput.setAttribute("data-valid", true);
            }
            this.renderSelectOptions(selectOptions, foundCommands);
        });

        if(this.command === "macro" || this.command === "jsdef"){
            this.changeExpressionInputToMultiLine();
            let parametersInput = this.element.querySelector("#parameters");
            let splitExpression = this.expression.split(" ");
            let parameters = splitExpression[0].split(",");
            parametersInput.value = parameters.join(" ");
            this.expression = splitExpression.slice(1).join(" ");
            this.insertTypeSelect(variableTypeOptions, "");
        } else if(this.command === "new"){
            let typeInput = this.element.querySelector(".form-item.type");
            typeInput.classList.remove("hidden");
            let splitExpression = this.expression.split(" ");
            let type = splitExpression[0];
            this.expression = splitExpression.slice(1).join(" ");
            this.insertTypeSelect(variableTypeOptions, type);
        } else {
            this.insertTypeSelect(variableTypeOptions, "");
        }
        let expressionInput = this.element.querySelector("#expression");
        expressionInput.value = this.expression;
    }
    async editVariable(targetElement){
        let formData = await assistOS.UI.extractFormInformation(targetElement);
        if(!formData.isValid){
            return;
        }
        let variableName = formData.data.name;
        let commandInput = this.element.querySelector("#command");
        let valid = commandInput.getAttribute("data-valid");
        if(valid === "false"){
            return;
        }
        let command = commandInput.value;
        let expression = formData.data.expression;
        expression = assistOS.UI.unsanitize(expression);
        let typeSelect = this.element.querySelector('custom-select');
        let selectedOption = typeSelect.querySelector(`.option[data-selected='true']`);
        let type = selectedOption.getAttribute('data-value');
        if(command === "new"){
            let variableType = type;
            if(!variableType){
                return alert("Please select a type");
            }
            expression = `${variableType} ${expression}`;
        }else if(command === "assign"){
            command = ":=";
        } else if(command === "macro" || command === "jsdef"){
            let parameters = assistOS.UI.unsanitize(formData.data.parameters);
            expression = `${parameters}\n \t${expression}\n end`;
        }
        expression = `@${variableName} ${command} ${expression}`;
        await assistOS.UI.closeModal(this.element, {
            expression: expression,
        });
    }
}