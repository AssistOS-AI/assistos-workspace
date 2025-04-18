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
    splitCommands(){
        let splitCommands = this.commands.split("\n");
        let commands = [];
        for(let command of splitCommands){
            const match = command.match(/^(@\S+)\s+(.+)$/);
            if(!match){
                continue;
            }
            const varName = match[1].slice(1);
            commands.push({
                varName: varName,
                expression: match[2]
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
            this.splitCommands();
        }
    }
    beforeRender(){
        this.initVariables();
        let splitCommands = this.splitCommands();
        let variablesHTML = "";
        this.tableLabels = "";
        if(splitCommands.length > 0){
            this.tableLabels = `
                        <div class="table-labels">
                              <div class="cell table-label">Name</div>
                              <div class="cell table-label">Expression</div>
                              <div class="cell table-label"></div>
                        </div>`;
        }
        for(let variable of splitCommands){
            variablesHTML += `
                <div class="cell">${variable.varName}</div>
                <div class="cell" data-name="${variable.varName}">${variable.expression}</div>
                <div class="cell actions-cell">
                    <img src="./wallet/assets/icons/eye-closed.svg" data-local-action="showVarValue ${variable.varName}" class="pointer" alt="value">
                    <img src="./wallet/assets/icons/edit.svg" data-local-action="openEditor ${variable.varName}" class="pointer" alt="edit">
                    <img src="./wallet/assets/icons/trash-can.svg" data-local-action="deleteVariable ${variable.varName}" class="pointer" alt="delete">
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
            this.invalidate();
        }
    }
    async deleteVariable(targetElement, varName){
        let splitCommands = this.commands.split("\n");
        let commandIndex = splitCommands.findIndex(command => command.includes(`@${varName}`));
        splitCommands.splice(commandIndex, 1);
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
                this.document.commands,
                this.document.comments);
        }
    }

    async openEditor(targetElement, varName){
        let variable = this.documentPresenter.variables.find(variable => variable.varName === varName);
        if(variable.customType){
            if(variable.customType === "Table"){
                //targetElement.insertAdjacentHTML("beforeend", `<table-editor data-presenter="table-editor" data-document-id="${this.document.docId}" data-chapter-id="${this.context.chapterId}" data-paragraph-id="${this.context.paragraphId}" data-var-name="${varName}"></table-editor>`);
                return;
            }
        }
        let expressionField = this.element.querySelector(`.cell[data-name="${varName}"]`);
        let expression = encodeURIComponent(expressionField.innerText);
        let inputs = await assistOS.UI.showModal("edit-basic-variable", { name: varName, expression: expression }, true);
        if(inputs){
            await this.saveVariable(varName, inputs.varName, inputs.expression);
            this.invalidate();
        }
    }

    async saveVariable(varName, newName, newExpression){
        let splitCommands = this.commands.split("\n");
        let commandIndex= splitCommands.findIndex(command => command.includes(`@${varName}`));
        splitCommands[commandIndex] = `@${newName} ${newExpression}`;
        this.commands = splitCommands.join("\n");
        await this.updateCommands(this.commands);
        await this.documentPresenter.refreshVariables();
    }
    async showVarValue(targetElement, varName){
        if(targetElement.src.includes("eye-closed")){
            targetElement.src = "./wallet/assets/icons/eye.svg";
            let varValue = await documentModule.getVarValue(assistOS.space.id, this.document.docId, varName);
            targetElement.insertAdjacentHTML("afterend", `<div class="var-value">value: ${typeof varValue === "object" ? "Object": varValue}</div>`);
        } else {
            targetElement.src = "./wallet/assets/icons/eye-closed.svg";
            targetElement.parentElement.querySelector(".var-value").remove();
        }
    }
}