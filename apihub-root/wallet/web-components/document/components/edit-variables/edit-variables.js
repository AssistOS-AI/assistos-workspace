import pluginUtils from "../../../../core/plugins/pluginUtils.js";
const documentModule = require("assistos").loadModule("document", {});

export class EditVariables {
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.context = pluginUtils.getContext(this.element);
        this.documentPresenter = this.element.closest("document-view-page").webSkelPresenter;
        this.document = this.documentPresenter._document;
        if(this.context.chapterId){
            this.chapter = this.document.chapters.find(chapter => chapter.id === this.context.chapterId);
        }
        if(this.context.paragraphId){
            this.paragraph = this.chapter.paragraphs.find(paragraph => paragraph.id === this.context.paragraphId);
        }
        this.invalidate();
    }
    attachVarExpressions(){
        let splitCommands = this.commands.split("\n");
        let commands = {};
        for(let command of splitCommands){
            const match = command.match(/^(@\S+)\s+(.+)$/);
            if(!match){
                continue;
            }
            const varName = match[1].slice(1);
            commands[varName] = command;
        }
        this.variables.forEach(obj => {
            if (commands[obj.varName] !== undefined) {
                obj.expression = commands[obj.varName];
            }
        });
    }
    initVariables(){
        if(this.context.paragraphId){
            this.variables = this.documentPresenter.variables.filter(variable => variable.paragraphId === this.context.paragraphId);
            this.commands = this.paragraph.commands;
            this.attachVarExpressions();
        } else if(this.context.chapterId){
            this.variables = this.documentPresenter.variables.filter(variable => variable.chapterId === this.context.chapterId);
            this.commands = this.chapter.commands;
            this.attachVarExpressions();
        } else {
            this.variables = this.documentPresenter.variables;
            this.commands = this.document.commands;
            this.attachVarExpressions();
        }
    }
    beforeRender(){
        this.initVariables();
        let variablesHTML = "";
        for(let variable of this.variables){
            variablesHTML += `
                <div class="cell">${variable.varName}</div>
                <div class="cell" data-name="${variable.varName}" contenteditable="false">${variable.expression}</div>
                <div class="cell actions-cell">
                    <img src="./wallet/assets/icons/edit.svg" data-local-action="editVariable ${variable.varName}" class="pointer" alt="delete">
                    <img src="./wallet/assets/icons/trash-can.svg" data-local-action="deleteVariable ${variable.varName}" class="pointer" alt="edit">
                </div>`
        }
        this.variablesHTML = variablesHTML;
    }
    async openAddVariableModal(){
        let confirmation = await assistOS.UI.showModal("add-variable", {
            "document-id": this.document.docId,
            "chapter-id": this.context.chapterId,
            "paragraph-id": this.context.paragraphId
        }, true);
        if(confirmation){
            await this.documentPresenter.refreshVariables();
            this.invalidate();
        }
    }
    async deleteVariable(targetElement, varName){
        let splitCommands = this.commands.split("\n");
        let commandIndex = splitCommands.findIndex(command => command.includes(`@${varName}`));
        splitCommands.splice(commandIndex, 1);
        this.commands = splitCommands.join("\n");
        await this.updateCommands(this.commands);
        await this.documentPresenter.refreshVariables();
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
                this.document.commands,
                this.document.comments);
        }
    }
    editVariable(targetElement, varName){
        let expressionField = this.element.querySelector(`.cell[data-name="${varName}"]`);
        if(expressionField.contentEditable === "true"){
            expressionField.contentEditable = false;
            expressionField.classList.remove("focused-field");
            expressionField.removeEventListener("focusout", this.boundSaveVariable);
            return;
        }
        expressionField.contentEditable = true;
        expressionField.classList.add("focused-field")
        expressionField.click();
        this.boundSaveVariable = this.saveVariable.bind(this, varName, expressionField);
        expressionField.addEventListener("focusout", this.boundSaveVariable, {once: true});
    }
    async saveVariable(varName, expressionField){
        expressionField.classList.remove("focused-field");
        expressionField.contentEditable = false;
        let splitCommands = this.commands.split("\n");
        let commandIndex= splitCommands.findIndex(command => command.includes(`@${varName}`));
        splitCommands[commandIndex] = expressionField.innerText;
        this.commands = splitCommands.join("\n");
        await this.updateCommands(this.commands);
        await this.documentPresenter.refreshVariables();
    }
}