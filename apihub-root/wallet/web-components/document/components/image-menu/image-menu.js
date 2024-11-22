const spaceModule = require("assistos").loadModule("space", {});
const llmModule= require('assistos').loadModule('llm',{})
const documentModule=require('assistos').loadModule('document',{})


export class ImageMenu{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.parentPresenter = this.element.closest("paragraph-item").webSkelPresenter;
        this.commandsEditor = this.parentPresenter.commandsEditor;
        this.paragraphId = this.parentPresenter.paragraph.id;
        this.invalidate();
    }
    beforeRender(){

    }
    async afterRender(){
        let imageElement = this.element.querySelector(".paragraph-image");
        let deleteImgButton = this.element.querySelector(".delete-image");
        if(this.parentPresenter.paragraph.commands.image){
            imageElement.classList.remove("hidden");
            deleteImgButton.classList.remove("hidden");
            imageElement.src = await spaceModule.getImageURL(this.parentPresenter.paragraph.commands.image.id);
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

    // async processMermaidResponse(response) {
    //     try {
    //         // Configurare mermaid
    //         mermaid.initialize({ startOnLoad: false });
    //
    //         // ID unic pentru container
    //         const containerId = 'diagram-container';
    //
    //         // Renderizare cod Mermaid
    //         const { svg } = await mermaid.render(containerId, response);
    //
    //         // Creare blob pentru conținutul SVG
    //         const blob = new Blob([svg], { type: 'image/svg+xml' });
    //
    //         // Creare link temporar pentru descărcare
    //         const link = document.createElement('a');
    //         link.href = URL.createObjectURL(blob);
    //         link.download = 'diagram.svg';
    //         link.click();
    //
    //         // Curățare URL temporar
    //         URL.revokeObjectURL(link.href);
    //
    //         console.log('Diagram generated and downloaded successfully!');
    //     } catch (error) {
    //         console.error('Error processing Mermaid response:', error);
    //     }
    // }

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
}