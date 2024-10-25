const spaceModule = require("assistos").loadModule("space", {});
export class ImageMenu{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.parentPresenter = this.element.closest("paragraph-item").webSkelPresenter;
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
        await this.parentPresenter.openInsertAttachmentModal("", "image");
        this.invalidate();
    }
    async deleteImage(){
        await this.parentPresenter.deleteCommand("","image");
        this.invalidate();
    }
}