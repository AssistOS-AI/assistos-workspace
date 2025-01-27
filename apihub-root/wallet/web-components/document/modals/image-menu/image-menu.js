import pluginUtils from "../../../../core/plugins/pluginUtils.js";
export class ImageMenu{

    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        let context = pluginUtils.getContext(this.element);
        this.paragraphId = context.paragraphId;
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