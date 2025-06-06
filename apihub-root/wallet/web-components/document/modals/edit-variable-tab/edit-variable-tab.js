const spaceModule = assistOS.loadModule("space");
import {
    constructFullExpression,
    attachEventListeners,
    selectOption,
    openSearchSelect,
    changeExpressionInputToMultiLine
} from "./varUtilsUI.js"

export class EditVariableTab {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentId = this.element.getAttribute("data-document-id");
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this.document = documentPresenter._document;
        this.element.classList.add("maintain-focus");
        let varName = this.element.getAttribute("data-name");
        this.variable = documentPresenter.variables.find(v => v.varName === varName);
        this.varName = varName;
        this.invalidate();
    }

    async beforeRender() {
        this.commands = await spaceModule.getCommands(assistOS.space.id);
        this.commands.sort();
    }
    /*search select*/
    openSearchSelect(){
        openSearchSelect(this);
    }
    selectOption(option){
        selectOption(this, option);
    }

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
    /*search select*/

    constructFullExpressionInitial(){
        let previewInput = this.element.querySelector(".expression-preview");
        let expression = this.variable.expression;
        if(this.variable.command === "macro" || this.variable.command === "jsdef"){
            let expressionWithoutParameters = this.variable.expression.replace(/\n/g, '\n\t');
            let params = this.variable.params.join(" ");
            expression = params + "\n \t" + expressionWithoutParameters + "\n end";
        }
        let command = this.variable.command;
        if(this.variable.conditional){
            command = `?${command}`;
        }
        previewInput.value = `@${this.variable.varName} ${command} ${expression}`;
        previewInput.style.height = "auto";
        previewInput.style.height = previewInput.scrollHeight + "px";
    }
    async afterRender() {
        this.constructFullExpressionInitial()
        let types = await spaceModule.getCustomTypes(assistOS.space.id);
        let variableTypeOptions = [{name: "Select a type", value: ""}];
        for(let type of types){
            variableTypeOptions.push({
                name: type,
                value: type
            })
        }
        if(this.variable.command === "macro" || this.variable.command === "jsdef"){
            let parametersInput = this.element.querySelector("#parameters");
            changeExpressionInputToMultiLine(this);
            parametersInput.value = this.variable.params.join(" ");
            this.insertTypeSelect(variableTypeOptions, "");
        } else if(this.variable.command === "new"){
            let typeInput = this.element.querySelector(".form-item.type");
            typeInput.classList.remove("hidden");
            this.insertTypeSelect(variableTypeOptions, this.variable.customType);
        } else {
            this.insertTypeSelect(variableTypeOptions, "");
        }
        let commandInput = this.element.querySelector("#command");
        let command = this.variable.command;
        if(command === ":="){
            command = "assign";
        }
        commandInput.value = command;
        let expressionInput = this.element.querySelector("#expression");
        expressionInput.value = this.variable.expression;
        let conditionalCheckbox = this.element.querySelector("#conditional");
        if(this.variable.conditional){
            conditionalCheckbox.checked = true;
        }
        this.originalVarName = this.variable.varName;
        attachEventListeners(this);
    }
    async editVariable(targetElement){
        let result = constructFullExpression(this);
        if(!result.ok){
            return;
        }
        await assistOS.UI.closeModal(this.element, {
            expression: result.fullExpression,
        });
    }
}