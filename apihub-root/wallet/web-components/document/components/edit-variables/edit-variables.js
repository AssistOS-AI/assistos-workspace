import pluginUtils from "../../../../core/plugins/pluginUtils.js";
const documentModule = assistOS.loadModule("document");
const spaceModule = assistOS.loadModule("space");
import {decodePercentCustom, isEditableValue} from "./../../../../imports.js";
export class EditVariables {
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.context = pluginUtils.getContext(this.element);
        this.documentPresenter = this.element.closest("document-view-page").webSkelPresenter;
        this.documentPresenter.observeChange("variables", this.invalidate);
        this.document = this.documentPresenter._document;
        if(this.context.chapterId){
            this.chapterPresenter = this.element.closest("chapter-item").webSkelPresenter;
            this.chapter = this.document.chapters.find(chapter => chapter.id === this.context.chapterId);
        }
        if(this.context.paragraphId){
            this.paragraphPresenter = this.element.closest("paragraph-item").webSkelPresenter;
            this.paragraph = this.chapter.paragraphs.find(paragraph => paragraph.id === this.context.paragraphId);
        }
        this.element.classList.add("maintain-focus");
        let pinned = this.element.getAttribute("data-pin");
        this.pinned = pinned === "true";
        this.invalidate();
    }

    async splitCommands(){
        let parsedCommands = await spaceModule.parseCommands(assistOS.space.id, this.context.chapterId, this.context.paragraphId, this.commands);
        let commands = [];
        for(let command of parsedCommands){
            let varName = command.outputVars[0];
            if(command.command === "assign"){
                command.command = ":="
            }
            for(let i = 0; i < command.inputVars.length; i++){
                if(command.varTypes[i] === "var"){
                    command.inputVars[i] = `$${command.inputVars[i]}`;
                }
            }
            let inputVars = command.inputVars.map(inputVar => inputVar).join(" ");
            if(command.command === "macro" || command.command === "jsdef"){
                inputVars = decodePercentCustom(inputVars);
            }
            let variable = this.documentPresenter.variables.find(variable => variable.varName === varName);
            let status = "";
            if(variable){
                if(variable.value !== undefined){
                    status = "ok";
                }
                if(variable.errorInfo){
                    status = "error";
                }
            }
            commands.push({
                status: status,
                varName: varName,
                command: command.command,
                expression: inputVars,
                value: variable ? variable.value : "",
            });
        }
        return commands;
    }
    initVariables(){
        if(this.context.paragraphId){
            this.commands = this.paragraph.commands;
        } else if(this.context.chapterId){
            this.commands = this.chapter.commands;
        } else {
            this.commands = this.document.commands;
        }
    }
    getStatusImg(status){
         let statusImg= "";
         if(status === "ok"){
            statusImg = `<img src="./wallet/assets/icons/success.svg" class="success-icon">`;
         } else if(status === "error"){
             statusImg = `<img src="./wallet/assets/icons/error.svg" class="error-icon">`
         }
         return statusImg;
    }

    async beforeRender(){
        this.initVariables();
        this.commandsArr = await this.splitCommands();
        let variablesHTML = "";
        this.variablesHeader = `<div class="no-variables">No variables defined</div>`;
        this.emptyTableClass = "";
        if(this.commandsArr.length > 0){
            this.variablesHeader = `
                <div class="cell table-label">Status</div>
                <div class="cell table-label">Name</div>
                <div class="cell table-label">Expression</div>
                <div class="cell table-label">Value</div>`;
        } else {
            this.emptyTableClass = "empty-table"
        }
        let showError = false;
        for(let variable of this.commandsArr){
            let statusImg = this.getStatusImg(variable.status);
            if(variable.status === "error"){
                showError = true;
            }
            if(variable.value === undefined){
                variable.value = "";
            }
            let editableValue = isEditableValue(variable.varName,  this.documentPresenter.variables);
            let valueCell = `<div class="cell">${typeof variable.value === "object" ? "Object": variable.value}</div>`
            if(editableValue){
                valueCell = `<div class="cell editable" data-local-action="openEditValue ${variable.varName}">${typeof variable.value === "object" ? "Object": variable.value}</div>`;
            }
            variablesHTML += `
                    <div class="cell">${statusImg}</div>
                    <div class="cell">${variable.varName}</div>
                    <div class="cell" data-name="${variable.varName}">${variable.command} ${variable.expression}</div>
                    ${valueCell}
                    <div class="cell actions-cell">
                        <div class="icon-container open-editor" data-local-action="openEditor ${variable.varName}">
                            <img src="./wallet/assets/icons/eye-edit.svg" class="pointer variable-icon" alt="edit">
                        </div>
                        <div class="delete-button-container" data-local-action="deleteVariable ${variable.varName}">
                            <img src="./wallet/assets/icons/trash-can.svg" class="pointer variable-icon" alt="delete">
                        </div>
                    </div>
                `;
        }
        if(showError){
            this.updateStatus("error");
        } else {
            this.updateStatus("ok");
        }
        this.variablesHTML = variablesHTML;
    }
    afterRender(){
        pluginUtils.renderPluginDefaultOptions(this.element);
        if(this.pinned){
            let pin = this.element.querySelector(".pin");
            pin.setAttribute("data-local-action", "unpinPlugin");
            pluginUtils.pinPlugin(pin, this.element);
        }
    }
    pinPlugin(pin){
        pin.setAttribute("data-local-action", "unpinPlugin");
        pluginUtils.pinPlugin(pin, this.element);
    }
    unpinPlugin(pin){
        pin.setAttribute("data-local-action", "pinPlugin");
        pluginUtils.unpinPlugin(pin, this.element);
    }
    async openAddVariableModal(){
        let confirmation = await assistOS.UI.showModal("add-variable", {
            "document-id": this.document.docId,
            "chapter-id": this.context.chapterId || "",
            "paragraph-id": this.context.paragraphId || "",
        }, true);
        if(confirmation){
            this.invalidate();
            await this.documentPresenter.refreshVariables();
        }
    }
    async openEditValue(valueCell, varName){
        let docVariable = this.documentPresenter.variables.find(variable => variable.varName === varName);
        let value = await assistOS.UI.showModal("edit-variable-value", {
            "var-name": varName
        }, true);
        if(value){
            docVariable.value = value;
            let isEditable = isEditableValue(varName, this.documentPresenter.variables);
            if(!isEditable){
                valueCell.classList.remove("editable");
                valueCell.removeAttribute("data-local-action");
            }
            valueCell.innerHTML = value;
            await documentModule.setVarValue(assistOS.space.id, this.document.docId, varName, value);
        }
    }
    async deleteVariable(targetElement, varName){
        let message = "Are you sure you want to delete this variable?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (!confirmation) {
            return;
        }
        let splitCommands = this.commands.split("\n");
        let commandIndex = splitCommands.findIndex(command => command.includes(`@${varName}`));
        let splitCommand = splitCommands[commandIndex].split(" ");
        let command = splitCommand[1];
        if(command === "macro" || command === "jsdef"){
            for(let i = commandIndex; i < splitCommands.length; i++){
                if(splitCommands[i].trim() === "end"){
                    splitCommands.splice(commandIndex, i + 1 - commandIndex);
                    break;
                }
            }
        } else {
            splitCommands.splice(commandIndex, 1);
        }
        this.commands = splitCommands.join("\n");
        await this.updateCommands(this.commands);
        this.invalidate();
    }
    async updateStatus(status){
        if(this.paragraph){
            await this.paragraphPresenter.updateStatus(status, "paragraph", "edit-variables", true);
        } else if(this.chapter){
            await this.chapterPresenter.updateStatus(status, "chapter", "edit-variables", true);
        } else {
            await this.documentPresenter.updateStatus(status, "infoText", "edit-variables", true);
        }
    }
    async updateCommands(commands){
        if(this.paragraph){
            this.paragraph.commands = commands;
            await documentModule.updateParagraph(assistOS.space.id, this.chapter.id,
                this.paragraph.id,
                this.paragraph.text,
                this.paragraph.commands,
                this.paragraph.comments);
        } else if(this.chapter){
            this.chapter.commands = commands;
            await documentModule.updateChapter(assistOS.space.id, this.chapter.id,
                this.chapter.title,
                this.chapter.commands,
                this.chapter.comments);
        } else {
            this.document.commands = commands;
            await documentModule.updateDocument(assistOS.space.id, this.document.id,
                this.document.title,
                this.document.docId,
                this.document.category,
                this.document.infoText,
                this.document.commands,
                this.document.comments);
        }
    }

    async openEditor(targetElement, varName){
        let variable = this.commandsArr.find(variable => variable.varName === varName);
        let inputs = await assistOS.UI.showModal("document-variable-details", { name: varName, command: variable.command, expression: variable.expression }, true);
        if(inputs){
            await this.saveVariable(varName, inputs.expression);
            this.invalidate();
        }
    }

    async saveVariable(varName, newExpression){
        let splitCommands = this.commands.split("\n");
        let foundVariable = splitCommands.find(command => command.includes(`@${varName}`));
        let oldCommand = foundVariable.split(" ")[1];
        if(oldCommand === "macro" || oldCommand === "jsdef"){
            const regex = new RegExp(`@${varName}[\\s\\S]*?end`, 'g');
            this.commands = this.commands.replace(regex, newExpression);
        } else {
            const regex = new RegExp(`@${varName}[^\n]*`, 'g');
            this.commands = this.commands.replace(regex, newExpression);
        }

        await this.updateCommands(this.commands);
        await this.documentPresenter.refreshVariables();
    }

}