const spaceModule = require("assistos").loadModule("space", {});
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
    closeModal(button){
        assistOS.UI.closeModal(this.element);
    }
}