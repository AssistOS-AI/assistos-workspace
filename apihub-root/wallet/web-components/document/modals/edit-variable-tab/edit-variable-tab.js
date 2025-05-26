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
        this.varName = this.element.getAttribute("data-name");
        this.expression = this.element.getAttribute("data-expression");
        this.command = this.element.getAttribute("data-command");
        this.invalidate();
    }

    async beforeRender() {
        this.commands = await spaceModule.getCommands(assistOS.space.id);
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
        let expression = this.expression;
        if(this.command === "macro" || this.command === "jsdef"){
            let splitExpression = expression.split(" ");
            let parameters = splitExpression[0].split(",");
            let separatedParameters = parameters.join(" ");
            let expressionWithoutParameters = splitExpression.slice(1);
            expressionWithoutParameters = expressionWithoutParameters.join(" ")
            expressionWithoutParameters = expressionWithoutParameters.replace(/\n/g, '\n\t');
            expression = separatedParameters + "\n \t" + expressionWithoutParameters + "\n end";
        }
        previewInput.value = `@${this.varName} ${this.command} ${expression}`;
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
        if(this.command === "macro" || this.command === "jsdef"){
            let parametersInput = this.element.querySelector("#parameters");
            changeExpressionInputToMultiLine(this);
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
        let commandInput = this.element.querySelector("#command");
        if(this.command === ":="){
            this.command = "assign";
        }
        commandInput.value = this.command;
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