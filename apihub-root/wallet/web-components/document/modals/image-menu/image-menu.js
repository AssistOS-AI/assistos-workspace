const spaceModule = require("assistos").loadModule("space", {});
const llmModule= require('assistos').loadModule('llm',{})
const documentModule=require('assistos').loadModule('document',{})

import mermaid from '../../../../lib/mermaid/mermaid.esm.min.mjs';

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
        let deleteImgButton = this.element.querySelector(".delete-image");
        if(this.paragraphPresenter.paragraph.commands.image){
            deleteImgButton.classList.remove("hidden");
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


    closeModal(button){
        assistOS.UI.closeModal(this.element);
    }
}