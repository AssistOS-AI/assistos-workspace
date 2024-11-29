const spaceModule = require("assistos").loadModule("space", {});
const llmModule= require('assistos').loadModule('llm',{})
const documentModule=require('assistos').loadModule('document',{})

import mermaid from '../../../../lib/mermaid/mermaid.esm.min.mjs';

let cnt = 0;

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
        mermaid.initialize({startOnLoad: false});

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
                Diagram Instructions: ${ this.paragraphPresenter._document.abstract}`;

        let response=await llmModule.generateText(assistOS.space.id,prompt)
        response=response.message;
        await documentModule.updateParagraphComment(assistOS.space.id, this.paragraphPresenter._document.id,  this.paragraphPresenter.paragraph.id,response)
        this.element.remove();

        this.downloadCode(response, "diagram.mmd");
        const mermaidCode = `
            \`\`\`mermaid
                    graph TD
                        start([Start])
                        start --> Autoru[Autor]
                        Autoru --> Ideea[Ideea]
                        Ideea --> Design[Design INF]
                        Design --> Programeaza[Programeaza]
                        Programeaza --> Implementeaza[Implementeaza]
                        Implementeaza --> PrimaVersiune[Prima Versiune]
                        PrimaVersiune --> Testare[Testare]
                        Testare --> Verificare[Verificare]
                        Verificare -->|Pas 1| JoculXOruri[Jocul x si 0 cu dificultati: easy, mediu si hard]
                        Programeaza --> API[Aparturi ale Programarii In Integrare cu Interfata Web]
                        Programeaza -->|Pas 2| InterfataGrafica[Creeaza Interfata Grafica INF]
                        InterfataGrafica --> LimbajulPython[Limbajul de Programare Python]
                        LimbajulPython --> JoculXOruri
                        JoculXOruri --> AI[AI] fafafafaf
                        AI --> Functionalitate[Functiile Jocului]
                        Functionalitate --> JoculXOruri
                        JoculXOruri --> Diagrama[Diagrama]
                        Diagrama --> JoculXOruri
                \`\`\`
            `;

        const example = `sequenceDiagram
                Alice ->> Bob: Hello Bob, how are you?
                Bob -->> John: How about you John?
                Bob --x Alice: I am good thanks!
                Bob -x John: I am good thanks!
                Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
                Bob --> Alice: Checking with John...
                Alice -> John: Yes... John, how are you?
       `;

        const cleanedCode = await this.removeFirstAndLastLine(response);
        // this.downloadCode(cleanedCode, 'mermaid2.txt');
        // this.generateGraphicalDiagram(cleanedCode);
        await this.validateMermaidCode(cleanedCode)
    }

    async validateMermaidCode(input) {
        // try {

            const parseOptions = { suppressErrors: true };

            if(!(await mermaid.parse(input, parseOptions) === false)){
                console.log("The mermaid code is correct!");
                await this.generateGraphicalDiagram(input);
            }

            else{
                console.log("Mermaid syntax error!");
                cnt += 1;
                console.log(cnt);
                if(cnt > 20){
                    console.log("We reached a final, the mermaid code is too wrong to be corrected.");
                    // return;
                }
                else{
                    console.log("Attempting to correct the Mermaid code.");
                    const prompt_2 = `Fix and validate the given Mermaid "graph TD" code:
                  - Correct syntax errors and relationships.
                  - Replace spaces in node names with underscores or camelCase.
                  - Exclude "classDef" or style definitions.
                  - Return only the corrected Mermaid code, no text or explanations. Input: ${input}`;

                    let response = await llmModule.generateText(assistOS.space.id, prompt_2);
                    response = response.message;
                    // const response_2 = await this.removeFirstAndLastLine(response);
                    console.log("Corrected Mermaid code:", response);

                    await this.validateMermaidCode(response);
                }

            }


        // } catch (error) {
        //     console.error("Mermaid syntax error:", error);
        //
        //     this.cnt += 1;
        //
        //     if (this.cnt !== 1) {
        //         console.log("We reached a final, the mermaid code is too wrong to be corrected.");
        //     } else {
        //         console.log("Attempting to correct the Mermaid code.");
        //
        //         const prompt_2 = `Validate and correct the given Mermaid diagram code.
        //         - Ensure the Mermaid code follows the "graph TD" syntax for a vertical diagram.
        //         - Fix any syntax errors or invalid relationships in the code.
        //         - Replace spaces in node names with underscores (_) or camelCase to ensure compatibility.
        //         - Ensure all node names are simple and comply with Mermaid's syntax rules.
        //         - Avoid using special characters like :, >, or | in node labels or relationships.
        //         - Provide only the corrected and well-formed Mermaid diagram code as output, no additional text.
        //         Input Mermaid code: ${input}`;
        //
        //         let response = await llmModule.generateText(assistOS.space.id, prompt_2);
        //         response = response.message;
        //         console.log("Corrected Mermaid code:", response);
        //
        //         // await this.validateMermaidCode(response);
        //     }
        }
    //}




    async generateGraphicalDiagram(input) {
        const { svg } = await mermaid.render('graphDiv', input);

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'diagram.svg';
        downloadLink.style.display = 'none';

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        URL.revokeObjectURL(url);
    }



    async removeFirstAndLastLine(input) {
        const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        if (lines.length <= 2) {
            throw new Error('Textul are mai puțin de trei linii, nu pot elimina prima și ultima linie.');
        }

        lines.shift();

        lines.pop();

        return lines.join('\n');
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

        // this.renderMermaidDiagram(response.message);


    }

    closeModal(button){
        assistOS.UI.closeModal(this.element);
    }
}