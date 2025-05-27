const documentModule = assistOS.loadModule("document");
const spaceModule = assistOS.loadModule("space");
import {
    attachEventListeners, constructFullExpression,
    openSearchSelect,
    selectOption
} from "../edit-variable-tab/varUtilsUI.js";
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
    async afterRender(){
        let types = await spaceModule.getCustomTypes(assistOS.space.id);
        let variableTypeOptions = [{name: "Select a type", value: ""}];
        for(let type of types){
            variableTypeOptions.push({
                name: type,
                value: type
            })
        }
        assistOS.UI.createElement("custom-select", ".select-type-container", {
                options: variableTypeOptions,
            },
            {
                "data-width": "230",
                "data-name": "type",
                "data-selected": "",
            })
        let commandInput = this.element.querySelector("#command");
        commandInput.value = "assign";
        attachEventListeners(this);
    }
    /*search select*/
    openSearchSelect(){
        openSearchSelect(this);
    }
    selectOption(option){
        selectOption(this, option);
    }
    /*search select*/
    async addVariable(targetElement){
        let result = constructFullExpression(this);
        if(!result.ok){
            return;
        }
        if(this.paragraphId){
            this.paragraph.commands += result.fullExpression;
            this.paragraph.commands += `\n`;
            await documentModule.updateParagraph(assistOS.space.id, this.chapterId,
                this.paragraphId,
                this.paragraph.text,
                this.paragraph.commands,
                this.paragraph.comments)
        } else if(this.chapterId){
            this.chapter.commands += result.fullExpression;
            this.chapter.commands += `\n`;
            await documentModule.updateChapter(assistOS.space.id, this.chapterId,
                this.chapter.title,
                this.chapter.commands,
                this.chapter.comments);
        } else {
            this.document.commands += result.fullExpression;
            this.document.commands += `\n`;
            await documentModule.updateDocument(assistOS.space.id, this.documentId,
                this.document.title,
                this.document.docId,
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