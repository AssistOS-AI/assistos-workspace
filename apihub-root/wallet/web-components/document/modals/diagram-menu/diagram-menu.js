const spaceModule = require("assistos").loadModule("space", {});
const llmModule= require('assistos').loadModule('llm',{})
const documentModule=require('assistos').loadModule('document',{})

import mermaid from '../../../../lib/mermaid/mermaid.esm.min.mjs';

let cnt = 0;

export class DiagramMenu{

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
        this.generatedMermaidCode = "";

    }
    beforeRender(){

    }
    async afterRender(){
        let imageElement = this.element.querySelector(".paragraph-image");
        let editDiagramButton = this.element.querySelector(".edit-diagram");
        let generateCode = this.element.querySelector(".generate-code");
        let downloadCode = this.element.querySelector(".download-code");
        let generateDiagram = this.element.querySelector(".generate-diagram");
        let diagramTextContainer = document.getElementById("text-input-container-2")
        if(this.paragraphPresenter.paragraph.commands.image){
            imageElement.classList.remove("hidden");
            imageElement.src = await spaceModule.getImageURL(this.paragraphPresenter.paragraph.commands.image.id);
            editDiagramButton.classList.remove("hidden");
            generateCode.classList.remove("hidden");
            const text = this.paragraphPresenter.paragraph.comment;
            document.getElementById("diagram-text-2").value += text;
            diagramTextContainer.classList.remove("hidden");
            downloadCode.classList.remove("hidden");
            generateDiagram.classList.add("hidden");
        }

    }
    async insertImage(){
        await this.commandsEditor.insertAttachmentCommand("image");
        this.invalidate();
    }
    async deleteImage() {
        await this.commandsEditor.deleteCommand("image");
        this.invalidate();
    }

    async submitChangesMermaid(){
        const submitButton = document.getElementById("submit-diagram-2");
        const input = document.getElementById("diagram-text-2").value
        const x = document.querySelector(".text-mermaid");
        // x.classList.add("hidden");
        submitButton.addEventListener("click", async () => {
            x.classList.add("hidden");
            const mermaidCode = this.paragraphPresenter.paragraph.comment;
            if(input === mermaidCode){
                x.classList.remove("hidden");
            }
            else{

                await this.generateModifiedDiagramFromMermaid(input);

            }
        });

    }

    async downloadDiagram(){
        const input = this.paragraphPresenter.paragraph.comment;
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

    async generateModifiedDiagramFromMermaid(input){
        // console.log(input);
        let error = this.element.querySelector(".modal-error");
        error.classList.add("hidden");
        await this.validateMermaidUserCode(input)
        // assistOS.UI.closeModal(this.element);
    }


    async submitChanges_code() {
        const checkboxes = document.querySelectorAll('.language-checkbox');
        let selectedLanguages = [];

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedLanguages.push(checkbox.value);
            }
        });

        if (selectedLanguages.length === 0) {
            alert('Selecteaza cel puțin un limbaj!');
            return;
        }

        if (selectedLanguages.length > 1) {
            alert('Selecteaza un singur limbaj!');
            return;
        }

        const selectedLanguage = selectedLanguages[0];
        console.log(`Limbaj selectat: ${selectedLanguage}`);

        await this.generateCodeApi(selectedLanguage);

    }

    async generateCodeApi(selectedLanguage){
        const mermaidCode = this.paragraphPresenter.paragraph.comment;
        const prompt = `
        Write a function in the programming language specified by '${selectedLanguage}' 
        that generates equivalent code for the application logic or structure represented by the Mermaid diagram provided below. 
        The generated code should define the corresponding classes, methods, or structures necessary to implement the described functionality.
        Use comments in the code to explain its purpose and structure.
        The output should only include code, focusing on the technical implementation without any graphical Mermaid diagram syntax.
        
        Mermaid Diagram Logic Description:
        ${mermaidCode}
        
        Programming Language:
        ${selectedLanguage}`;

        let response3 = await llmModule.generateText(assistOS.space.id,prompt)
        response3=response3.message;

        this.element.remove();

        console.log("Codul generat: ", response3);

        const blob = new Blob([response3], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'generated_code.txt';
        a.click();

    }



    async generateCode() {
        const generateCodeButton = document.querySelector("[data-local-action='generateCode']");
        const codeInputContainer = document.getElementById("code-input-container");

        if (!generateCodeButton || !codeInputContainer) {
            console.error("Elementele necesare nu au fost gasite.");
            return;
        }

        if (!generateCodeButton.dataset.eventAttached) {
            generateCodeButton.addEventListener("click", () => {
                codeInputContainer.classList.toggle("hidden");
            });

            generateCodeButton.dataset.eventAttached = true;
        }
    }


    async submitChanges(){
        const submitButton = document.getElementById("submit-diagram");
        const input = document.getElementById("diagram-text").value

        submitButton.addEventListener("click", async () => {
            // const mermaidText = await documentModule.getParagraphText(assistOS.space.id, this.paragraphPresenter._document.id, this.paragraphPresenter.paragraph.id);

            const mermaidCode = this.paragraphPresenter.paragraph.comment;
            console.log(mermaidCode);

            await this.generateModifiedDiagram(input, mermaidCode);
        });

    }

    async generateModifiedDiagram(input, mermaidCode){
        console.log("Generating diagram with input:", input);

        const prompt = `Modify the given Mermaid diagram code according to the input instructions provided.
                - Base Diagram Code: 
                ${mermaidCode}
                - Modifications or Additions:
                ${input}
                - Ensure the output is a valid Mermaid diagram using "graph TD" for a vertical diagram.
                - Follow valid Mermaid syntax, ensuring proper relationships and node definitions.
                - Avoid using special characters like :, >, or | in node labels or relationships.
                - Replace spaces in node names with underscores (_) or camelCase to ensure compatibility.
                - Ensure all node names are simple and follow Mermaid's syntax rules.
                - Validate that the final output is well-formed and error-free.
                - Output only the modified diagram code, no additional text.`;

        let response2 = await llmModule.generateText(assistOS.space.id,prompt)
        response2=response2.message;
        // await documentModule.updateParagraphComment(assistOS.space.id, this.paragraphPresenter._document.id,  this.paragraphPresenter.paragraph.id,response2)
        this.element.remove();
        console.log("Initial response", response2);
        const cleanedCode2 = await this.removeFirstAndLastLine(response2);
        console.log("2 response", cleanedCode2);

        await this.validateMermaidCode(cleanedCode2)

    }


    async editDiagram() {
        const editDiagramButton = document.querySelector("[data-local-action='editDiagram']");
        const textInputContainer = document.getElementById("text-input-container");

        if (!editDiagramButton || !textInputContainer) {
            console.error("Elementele necesare nu au fost gasite.");
            return;
        }

        if (!editDiagramButton.dataset.eventAttached) {
            editDiagramButton.addEventListener("click", () => {
                textInputContainer.classList.toggle("hidden");
            });

            editDiagramButton.dataset.eventAttached = true;
        }
    }


    async generateDiagramCode(){

        const prompt = `Generate a valid Mermaid diagram code using "graph TD" for a vertical diagram.
                - Output only the diagram code, no additional text.
                - Use valid Mermaid syntax with proper relationships and node definitions.
                - Avoid using special characters like :, >, or | in node labels or relationships.
                - Replace spaces in node names with underscores (_) or camelCase to ensure compatibility.
                - Ensure all node names are simple and follow Mermaid's syntax rules.
                - Validate that the output is a well-formed and error-free Mermaid diagram.
                Diagram Instructions: ${ this.paragraphPresenter._document.abstract + this.paragraphPresenter.paragraph.text}`;

        let response=await llmModule.generateText(assistOS.space.id,prompt)
        response=response.message;
        this.paragraphPresenter.paragraph.comment = response;
        // await documentModule.updateParagraphComment(assistOS.space.id, this.paragraphPresenter._document.id,  this.paragraphPresenter.paragraph.id,response)

        const cleanedCode = await this.removeFirstAndLastLine(response);
        // this.downloadCode(cleanedCode, 'mermaid2.txt');
        // this.generateGraphicalDiagram(cleanedCode);
        await this.validateMermaidCode(cleanedCode)
        assistOS.UI.closeModal(this.element);
    }

    async validateMermaidCode(input) {
        const parseOptions = {suppressErrors: true};

        if (!(await mermaid.parse(input, parseOptions) === false)) {
            console.log("The mermaid code is correct!");
            // this.generatedMermaidCode = input;
            await documentModule.updateParagraphComment(assistOS.space.id, this.paragraphPresenter._document.id,  this.paragraphPresenter.paragraph.id,input)
            await this.generateGraphicalDiagram(input);

        } else {
            console.log("Mermaid syntax error!");
            cnt += 1;
            console.log(cnt);
            if (cnt > 20) {
                console.log("We reached a final, the mermaid code is too wrong to be corrected.");
                return;
            } else {
                console.log("Attempting to correct the Mermaid code.");
                const prompt_2 = `Fix and validate the given Mermaid "graph TD" code:
                  - Correct syntax errors and relationships.
                  - Do not include any code block markers (e.g., \`\`\`mermaid).
                  - Replace spaces in node names with underscores or camelCase.
                  - Exclude "classDef" or style definitions.
                  - Return only the corrected Mermaid code, no text or explanations. Input: ${input}`;

                let response = await llmModule.generateText(assistOS.space.id, prompt_2);
                response = response.message;
                console.log("Corrected Mermaid code:", response);

                await this.validateMermaidCode(response);
            }

        }

    }

    async validateMermaidUserCode(input) {
        const parseOptions = {suppressErrors: true};

        if (!(await mermaid.parse(input, parseOptions) === false)) {
            console.log("The mermaid code is correct!");
            await documentModule.updateParagraphComment(assistOS.space.id, this.paragraphPresenter._document.id,  this.paragraphPresenter.paragraph.id,input)
            await this.generateGraphicalDiagram(input);

        } else {
            // console.log("Mermaid syntax error!");
            // cnt += 1;
            // console.log(cnt);
            // if (cnt > 20) {
            //     console.log("We reached a final, the mermaid code is too wrong to be corrected.");
            //     return;
            // } else {
            //     console.log("Attempting to correct the Mermaid code.");
            //     const prompt_2 = `Fix and validate the given Mermaid "graph TD" code:
            //       - Correct syntax errors and relationships.
            //       - Do not include any code block markers (e.g., \`\`\`mermaid).
            //       - Replace spaces in node names with underscores or camelCase.
            //       - Exclude "classDef" or style definitions.
            //       - Return only the corrected Mermaid code, no text or explanations. Input: ${input}`;
            //
            //     let response = await llmModule.generateText(assistOS.space.id, prompt_2);
            //     response = response.message;
            //     console.log("Corrected Mermaid code:", response);
            //
            //     await this.validateMermaidCode(response);
            // }
            let error = this.element.querySelector(".modal-error");
            error.classList.remove("hidden");

        }

    }

    async generateGraphicalDiagram(input) {
        const { svg } = await mermaid.render('graphDiv', input);

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        /*
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'diagram.svg';
        downloadLink.style.display = 'none';

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        URL.revokeObjectURL(url);
        */

        await this.downloadCode(svg, input);
    }


    async downloadCode(content, mermaidCode) {
        try {
            const svgCode = content;

            const img = new Image();
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgCode)));

            img.onload = async () => {
                const targetWidth = 1920;
                const targetHeight = 1080;

                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');

                const scaleX = targetWidth / img.width;
                const scaleY = targetHeight / img.height;
                const scale = Math.min(scaleX, scaleY);

                const offsetX = (targetWidth - img.width * scale) / 2;
                const offsetY = (targetHeight - img.height * scale) / 2;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);

                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        console.error('Error: Generated blob is null.');
                        return;
                    }

                    const arrayBuffer = await blob.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);

                    const imageId = await spaceModule.putImage(uint8Array);

                    this.paragraphPresenter.paragraph.commands.image = {
                        id: imageId,
                        width: canvas.width,
                        height: canvas.height,
                    };

                    const documentId = this.paragraphPresenter._document.id;
                    const paragraphId = this.paragraphPresenter.paragraph.id;

                    await documentModule.updateParagraphCommands(
                        assistOS.space.id,
                        documentId,
                        paragraphId,
                        this.paragraphPresenter.paragraph.commands
                    );

                    /*
                    const downloadLink = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    downloadLink.href = url;
                    downloadLink.download = 'diagram.png';
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                    URL.revokeObjectURL(url);
                    */

                    canvas.remove();
                    let videoPresenter = this.paragraphPresenter.videoPresenter;
                    videoPresenter.refreshVideoPreview();

                }, 'image/png');
            };

            img.onerror = () => {
                console.error('Error: Could not load SVG image.');
            };
        } catch (error) {
            console.error('Error during code processing:', error);
        }
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



    closeModal(button){
        assistOS.UI.closeModal(this.element);
    }
}