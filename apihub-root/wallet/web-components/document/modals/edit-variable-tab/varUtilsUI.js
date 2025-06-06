export function constructFullExpression(presenter){
    const self = presenter;
    let saveButton = self.element.querySelector(".save-variable");
    let nameInput = self.element.querySelector("#name");
    let variableName = nameInput.value;
    let commandInput = self.element.querySelector("#command");
    let valid = commandInput.getAttribute("data-valid");
    let trimmedName = nameInput.value.trim();

    let command = commandInput.value;
    let expressionInput = self.element.querySelector("#expression");
    let expression = expressionInput.value;
    expression = assistOS.UI.unsanitize(expression);

    let foundCommand = self.commands.find(c => command.toLowerCase() === c.toLowerCase());
    if(!foundCommand){
        saveButton.classList.add("disabled");
        return {ok: false, fullExpression: `@${variableName} [invalid command] ${expression}`};
    }

    if(valid === "false"){
        saveButton.classList.add("disabled");
        return {ok: false, fullExpression: `@${variableName} [invalid command] ${expression}`};
    }
    if(trimmedName.includes(" ") || trimmedName === ""){
        saveButton.classList.add("disabled");
        if(command === "assign"){
            command = ":=";
        }
        return {ok: false, fullExpression: `@[invalid name] ${command} ${expression}`};
    }
    let res = checkVarName(self.originalVarName, trimmedName, command, expression, saveButton);
    if(res){
        return res;
    }

    let typeSelect = self.element.querySelector('custom-select');
    let selectedOption = typeSelect.querySelector(`.option[data-selected='true']`);
    let type = selectedOption.getAttribute('data-value');
    if(command === "new"){
        let variableType = type;
        if(!variableType){
            saveButton.classList.add("disabled");
            return {ok: false, fullExpression: `@${variableName} new [invalid type] ${expression}`};
        }
        expression = `${variableType} ${expression}`;
    }else if(command === "assign"){
        command = ":=";
    } else if(command === "macro" || command === "jsdef"){
        let parametersInput = self.element.querySelector("#parameters");
        let parameters = assistOS.UI.unsanitize(parametersInput.value);
        expression = expression.replace(/\n/g, '\n\t');
        expression = `${parameters}\n \t${expression}\n end`;
    }
    let conditionalCheckbox = self.element.querySelector("#conditional");
    if(conditionalCheckbox.checked){
        command = `?${command}`;
    }
    expression = `@${variableName} ${command} ${expression}`;
    saveButton.classList.remove("disabled");
    return {ok: true, fullExpression: expression};
}
function checkVarName(originalName, trimmedName, command, expression, saveButton){
    let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
    let alreadyExists = documentPresenter.variables.some(variable =>
        variable.varName === trimmedName && variable.varName !== originalName
    );
    if(alreadyExists){
        saveButton.classList.add("disabled");
        if(command === "assign"){
            command = ":=";
        }
        return {ok: false, fullExpression: `@[var name already exists] ${command} ${expression}`};
    }
}
export function changePreviewValue(presenter){
    const self = presenter;
    let previewInput = self.element.querySelector(".expression-preview");
    let result = constructFullExpression(self);
    previewInput.value = result.fullExpression;
    previewInput.style.height = "auto";
    previewInput.style.height = previewInput.scrollHeight + "px";
}
export function attachEventListeners(presenter){
    const self = presenter;
    let commandInput = self.element.querySelector("#command");
    commandInput.addEventListener("input", event => {
        changePreviewValue(self);
    })
    let selectOptions = self.element.querySelector(".select-options");
    commandInput.addEventListener("input", (event) => {
        let value = event.target.value;
        let foundCommands = self.commands.filter(command => command.toLowerCase().includes(value.toLowerCase()));
        if(foundCommands.length === 0){
            commandInput.setAttribute("data-valid", false);
        } else {
            commandInput.setAttribute("data-valid", true);
        }
        renderSelectOptions(selectOptions, foundCommands);
    });
    let nameInput = self.element.querySelector("#name");
    nameInput.addEventListener("input", event => {
        changePreviewValue(self);
    })
    let expressionInput = self.element.querySelector(".expression-input");
    expressionInput.addEventListener("input", event => {
        changePreviewValue(self);
    })
    let currentExpressionType = self.element.querySelector("#expression");
    if(self.expression){
        currentExpressionType.value = self.expression;
    }

    let expressionTextarea = self.element.querySelector(".expression-multi-line");
    expressionTextarea.addEventListener("input", event => {
        changePreviewValue(self);
    });
    let parametersInput = self.element.querySelector("#parameters");
    parametersInput.addEventListener("input", event => {
        changePreviewValue(self);
    });
    let typeSelect = self.element.querySelector(`custom-select[data-name="type"]`);
    typeSelect.addEventListener("change", event => {
        changePreviewValue(self);
    });
    let conditionalCheckbox = self.element.querySelector("#conditional");
    conditionalCheckbox.addEventListener("change", event => {
        changePreviewValue(self);
    });

}
export function selectOption(presenter, option){
    const self = presenter;
    let value = option.getAttribute("data-value");
    let searchSelect = option.closest(".search-select");
    let input = searchSelect.querySelector("input");
    input.value = value;
    let typeInput = self.element.querySelector(".form-item.type");
    if(value === "new"){
        typeInput.classList.remove("hidden");
    } else {
        typeInput.classList.add("hidden");
    }
    let conditionalCheckBoxItem = self.element.querySelector(".conditional-command-item");
    let conditionalCheckbox = self.element.querySelector("#conditional");
    if(value === "macro" || value === "jsdef"){
        conditionalCheckbox.checked = false;
        changeExpressionInputToMultiLine(self);
        conditionalCheckBoxItem.classList.add("hidden");
    } else {
        changeMultiLineToSingleLine(self);
        conditionalCheckBoxItem.classList.remove("hidden");
    }
    changePreviewValue(self);
}
export function renderSelectOptions(selectOptions, commands){
    let variableCommandOptions = "";
    for(let command of commands){
        variableCommandOptions += `<div class="option" data-local-action="selectOption" data-value="${command}">${command}</div>`;
    }
    selectOptions.innerHTML = variableCommandOptions;
}
export function changeExpressionInputToMultiLine(self){
    let expressionInput = self.element.querySelector(".expression-input");
    expressionInput.classList.add("hidden");
    expressionInput.name = "";
    expressionInput.id = "";
    let expressionTextarea = self.element.querySelector(".expression-multi-line");
    expressionTextarea.classList.remove("hidden");
    expressionTextarea.name = "expression";
    expressionTextarea.id = "expression";
    let parametersInput = self.element.querySelector(".multi-line-expr-parameters");
    parametersInput.classList.remove("hidden");
}
export function changeMultiLineToSingleLine(self){
    let expressionInput = self.element.querySelector(".expression-input");
    expressionInput.classList.remove("hidden");
    expressionInput.name = "expression";
    expressionInput.id = "expression";
    let expressionTextarea = self.element.querySelector(".expression-multi-line");
    expressionTextarea.classList.add("hidden");
    expressionTextarea.name = "";
    expressionTextarea.id = "";
    let parametersInput = self.element.querySelector(".multi-line-expr-parameters");
    parametersInput.classList.add("hidden");
}

export function openSearchSelect(presenter){
    const self = presenter;
    let selectOptions = self.element.querySelector(".select-options");
    if(!selectOptions.classList.contains("hidden")){
        return;
    }
    renderSelectOptions(selectOptions, self.commands);
    let commandInput = self.element.querySelector("#command");
    let currentValue = commandInput.value;
    selectOptions.classList.remove("hidden");
    self.controller = new AbortController();
    let selectedOption = selectOptions.querySelector(`.option[data-value="${currentValue}"]`);
    if(selectedOption){
        selectedOption.classList.add("selected");
    }
    let boundCloseSearchSelect = closeSearchSelect.bind(self, selectOptions);
    document.addEventListener("click", boundCloseSearchSelect, {signal: self.controller.signal});
}
export function closeSearchSelect(selectOptions, event){
    if(!event.target.closest(".search-select-input")){
        selectOptions.innerHTML = "";
        selectOptions.classList.add("hidden");
        this.controller.abort();
    }
}