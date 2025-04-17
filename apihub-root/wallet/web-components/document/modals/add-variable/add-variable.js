const documentModule = require("assistos").loadModule("document", {});
import {getVarDefinitionCommand} from "../../../../imports.js";
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
    beforeRender(){
        let variableTypes = ["Any", "Table", "Document"];
        let variableTypeOptions = "";
        for(let type of variableTypes){
            variableTypeOptions += `<option value="${type}">${type}</option>`;
        }
        this.variableTypeOptions = variableTypeOptions;
    }
    afterRender(){
        let typeSelect = this.element.querySelector("#type");
        typeSelect.addEventListener("change", (event) => {
            let value = event.target.value;
            if(value === "Table"){
                let commandInput = this.element.querySelector(".form-item.command");
                commandInput.classList.add("hidden");
                let columnsInput = this.element.querySelector(".form-item.columns");
                columnsInput.classList.remove("hidden");
            }
        })
    }
    async addVariable(targetElement){
        let formData = await assistOS.UI.extractFormInformation(targetElement);
        if(!formData.isValid){
            return;
        }
        let variableName = formData.data.name;
        let command = formData.data.command;
        let variableType = formData.data.type;
        if(variableType === "Any"){
            variableType = undefined;
        } else if(variableType === "Table"){
            formData.data.columns = parseInt(formData.data.columns);
            for(let i = 0; i < formData.data.columns; i++){
                command += `c${i} `;
            }
        }
        let fullCommand = getVarDefinitionCommand(variableName, variableType, command);

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
                this.chapter.comments,
                this.chapter.commands);
        } else {
            this.document.commands += fullCommand;
            this.document.commands += `\n`;
            await documentModule.updateDocument(assistOS.space.id, this.documentId,
                this.document.title,
                this.document.category,
                this.document.infoText,
                this.document.commands,
                this.document.comments,);
        }
        await assistOS.UI.closeModal(this.element, true);
    }
    async closeModal(){
        await assistOS.UI.closeModal(this.element);
    }
}