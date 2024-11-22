const spaceModule = require("assistos").loadModule("space", {});
const llmModule= require('assistos').loadModule('llm',{})
const documentModule=require('assistos').loadModule('document',{})

export class ImageMenu{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this.paragraphId = this.element.getAttribute("data-paragraph-id");
        this.paragraphPresenter = documentPresenter.element.querySelector(`paragraph-item[data-paragraph-id="${this.paragraphId}"]`).webSkelPresenter;
        this.commandsEditor = this.paragraphPresenter.commandsEditor;
        this.element.classList.add("maintain-focus");
        this.invalidate();
    }
    beforeRender(){

    }
    async afterRender(){
        let imageElement = this.element.querySelector(".paragraph-image");
        let deleteImgButton = this.element.querySelector(".delete-image");
        if(this.paragraphPresenter.paragraph.commands.image){
            imageElement.classList.remove("hidden");
            deleteImgButton.classList.remove("hidden");
            imageElement.src = await spaceModule.getImageURL(this.paragraphPresenter.paragraph.commands.image.id);
        }
    }
    async insertImage(){
        await this.commandsEditor.insertAttachmentCommand("image");
        this.invalidate();
    }
    async deleteImage(){
        await this.commandsEditor.deleteCommand("image");
        this.invalidate();
    }

    async generateDiagramCode(){

        const prompt = `Generate a valid Mermaid diagram code using "graph TD" for a vertical diagram.
                - Output only the diagram code, no additional text.
                - Use valid Mermaid syntax with proper relationships and node definitions.
                - Avoid using special characters like :, >, or | in node labels or relationships.
                - Replace spaces in node names with underscores (_) or camelCase to ensure compatibility.
                - Ensure all node names are simple and follow Mermaid's syntax rules.
                - Validate that the output is a well-formed and error-free Mermaid diagram.
                Diagram Instructions: ${this.parentPresenter._document.abstract}`;

        let response = await llmModule.generateText({
            prompt,
            modelName: "meta-llama/Meta-Llama-3.1-8B-Instruct"
        }, assistOS.space.id);
        await documentModule.updateParagraphComment(assistOS.space.id,this.parentPresenter._document.id, this.parentPresenter.paragraph.id,response)
        this.element.remove();
        this.downloadCode(response, "diagram.mmd");
    }

    downloadCode(content, fileName) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }
    closeModal(button){
        assistOS.UI.closeModal(this.element);
    }
}