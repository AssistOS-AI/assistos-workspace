const documentModule = require("assistos").loadModule("document", {});
const spaceModule = require("assistos").loadModule("space", {});
export class AddVariable {
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.element = element;
        this.documentId = this.element.getAttribute("data-document-id");
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.paragraphId = this.element.getAttribute("data-paragraph-id");
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this.document = documentPresenter._document;
        if(this.chapterId){
            this.chapter = this.document.chapters.find(chapter => chapter.id === this.chapterId);
        }
        if(this.paragraphId){
            this.paragraph = this.chapter.paragraphs.find(paragraph => paragraph.id === this.paragraphId);
        }
        this.element.classList.add("maintain-focus");
        this.invalidate();
    }
    async beforeRender(){
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
    afterRender(){
        let commandSelect = this.element.querySelector("#command");
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
    async addVariable(targetElement){
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
        } else if(command === "assign"){
            command = ":=";
        } else if(command === "macro" || command === "jsdef"){
            let parameters = assistOS.UI.unsanitize(formData.data.parameters);
            expression = `${parameters}\n \t${expression}\n end`;
        }
        let fullCommand = `@${variableName} ${command} ${expression}`;

        if(this.paragraphId){
            this.paragraph.commands += fullCommand;
            this.paragraph.commands += `\n`;
            await documentModule.updateParagraph(assistOS.space.id, this.chapterId,
                this.paragraphId,
                this.paragraph.text,
                this.paragraph.commands,
                this.paragraph.comments)
        } else if(this.chapterId){
            this.chapter.commands += fullCommand;
            this.chapter.commands += `\n`;
            await documentModule.updateChapter(assistOS.space.id, this.chapterId,
                this.chapter.title,
                this.chapter.commands,
                this.chapter.comments);
        } else {
            this.document.commands += fullCommand;
            this.document.commands += `\n`;
            await documentModule.updateDocument(assistOS.space.id, this.documentId,
                this.document.title,
                this.document.category,
                this.document.infoText,
                this.document.commands,
                this.document.comments);
        }
        await assistOS.UI.closeModal(this.element, true);
    }
    async closeModal(){
        await assistOS.UI.closeModal(this.element);
    }
}