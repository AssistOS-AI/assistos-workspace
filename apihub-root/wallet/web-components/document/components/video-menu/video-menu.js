const spaceModule = require("assistos").loadModule("space", {});
export class VideoMenu{
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
        let videoElement = this.element.querySelector(".paragraph-video");
        let deleteVideoButton = this.element.querySelector(".delete-video");
        let deleteLipsyncButton = this.element.querySelector(".delete-lipsync");
        if(this.parentPresenter.paragraph.commands.video){
            videoElement.classList.remove("hidden");
            deleteVideoButton.classList.remove("hidden");
            videoElement.src = await spaceModule.getVideoURL(this.parentPresenter.paragraph.commands.video.id);
        }
        if(this.parentPresenter.paragraph.commands.lipsync){
            deleteLipsyncButton.classList.remove("hidden");
        }
    }
    async insertVideo(){
        await this.parentPresenter.openInsertAttachmentModal("", "video");
    }
    async deleteVideo(){
        await this.parentPresenter.deleteCommand("","video");
        this.invalidate();
    }
    async insertLipSync(){
        await this.parentPresenter.insertLipSync();
    }
    async deleteLipSync(){
        await this.parentPresenter.deleteCommand("","lipsync");
        this.invalidate();
    }
}