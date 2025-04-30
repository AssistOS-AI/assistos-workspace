import pluginUtils from "../../../../core/plugins/pluginUtils.js";
const documentModule = require("assistos").loadModule("document", {});

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
            let variable = this.documentPresenter.variables.find(variable => variable.varName === varName);
            commands.push({
                varName: varName,
                expression: match[2],
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
            this.splitCommands();
        }
    }
    beforeRender(){
        this.initVariables();
        let splitCommands = this.splitCommands();
        let variablesHTML = "";
        for(let variable of splitCommands){
            variablesHTML += `
                    <div class="cell">${variable.varName}</div>
                    <div class="cell" data-name="${variable.varName}">${variable.expression}</div>
                    <div class="cell">${typeof variable.value === "object" ? "Object": variable.value}</div>
                    <div class="cell">${variable.status || "......."}</div>
                    <div class="cell actions-cell">
                        <div class="action-button-container right-margin" data-local-action="openEditor ${variable.varName}">
                            <img src="./wallet/assets/icons/eye.svg" class="pointer" alt="edit">
                        </div>
                        <div class="delete-button-container" data-local-action="deleteVariable ${variable.varName}">
                            <img src="./wallet/assets/icons/trash-can.svg" class="pointer delete-icon" alt="delete">
                        </div>
                    </div>
                `;
        }
        this.variablesHTML = variablesHTML;
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
        let inputs = await assistOS.UI.showModal("document-variable-details", { name: varName, expression: expression }, true);
        if(inputs){
            await this.saveVariable(varName, inputs.varName, inputs.expression);
            this.invalidate();
        }
    }

    async saveVariable(varName, newName, newExpression){
        let splitCommands = this.commands.split("\n");
        let commandIndex = splitCommands.findIndex(command => command.includes(`@${varName}`));
        newExpression = assistOS.UI.unsanitize(newExpression);
        splitCommands[commandIndex] = `@${newName} ${newExpression}`;
        this.commands = splitCommands.join("\n");
        await this.updateCommands(this.commands);
        await this.documentPresenter.refreshVariables();
    }

}