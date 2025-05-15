import pluginUtils from "../../../../core/plugins/pluginUtils.js";
const documentModule = require("assistos").loadModule("document", {});
const spaceModule = require("assistos").loadModule("space", {});
import {decodePercentCustom} from "./../../../../imports.js";
export class EditVariables {
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.context = pluginUtils.getContext(this.element);
        this.documentPresenter = this.element.closest("document-view-page").webSkelPresenter;
        this.documentPresenter.observeChange("variables", this.invalidate);
        this.document = this.documentPresenter._document;
        if(this.context.chapterId){
            this.chapter = this.document.chapters.find(chapter => chapter.id === this.context.chapterId);
        }
        if(this.context.paragraphId){
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
            let inputVars = command.inputVars.map(inputVar => inputVar).join(" ");
            if(command.command === "macro" || command.command === "jsdef"){
                inputVars = decodePercentCustom(inputVars);
            }
            let variable = this.documentPresenter.variables.find(variable => variable.varName === varName);
            commands.push({
                varName: varName,
                command: command.command,
                expression: inputVars,
                value: variable ? variable.value : undefined,
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
    async beforeRender(){
        this.initVariables();
        this.commandsArr = await this.splitCommands();
        let variablesHTML = "";
        this.variablesHeader = `<div class="no-variables">No variables defined</div>`;
        this.emptyTableClass = "";
        if(this.commandsArr.length > 0){
            this.variablesHeader = `
                <div class="cell table-label">Name</div>
                <div class="cell table-label">Expression</div>
                <div class="cell table-label">Value</div>
                <div class="cell table-label">Status</div>`;
        } else {
            this.emptyTableClass = "empty-table"
        }
        for(let variable of this.commandsArr){
            variablesHTML += `
                    <div class="cell">${variable.varName}</div>
                    <div class="cell" data-name="${variable.varName}">${variable.command} ${variable.expression}</div>
                    <div class="cell">${typeof variable.value === "object" ? "Object": variable.value}</div>
                    <div class="cell">${variable.status || "......."}</div>
                    <div class="cell actions-cell">
                        <div class="icon-container right-margin" data-local-action="openEditor ${variable.varName}">
                            <img src="./wallet/assets/icons/eye-edit.svg" class="pointer" alt="edit">
                        </div>
                        <div class="delete-button-container" data-local-action="deleteVariable ${variable.varName}">
                            <img src="./wallet/assets/icons/trash-can.svg" class="pointer delete-icon" alt="delete">
                        </div>
                    </div>
                `;
        }
        this.variablesHTML = variablesHTML;
    }
    afterRender(){
        pluginUtils.renderPluginDefaultOptions(this.element);
        if(this.pinned){
            let pin = this.element.querySelector(".pin");
            pluginUtils.pinPlugin(pin, this.element);
        }
    }
    pinPlugin(pin){
        pluginUtils.pinPlugin(pin, this.element);
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
            await documentModule.updateDocument(assistOS.space.id,
                this.document.docId,
                this.document.title,
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