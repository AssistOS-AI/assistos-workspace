const spaceModule = require("assistos").loadModule("space", {});
const documentModule = require("assistos").loadModule("document", {});
const utilModule = require("assistos").loadModule("util", {});
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
        let lipSyncCheckbox = this.element.querySelector("#lip-sync");
        if(this.parentPresenter.paragraph.commands.video){
            videoElement.classList.remove("hidden");
            deleteVideoButton.classList.remove("hidden");
            videoElement.src = await spaceModule.getVideoURL(this.parentPresenter.paragraph.commands.video.id);
        }
        if(this.parentPresenter.paragraph.commands.lipsync){
            lipSyncCheckbox.checked = true;
        }
    }
    async handleCheckbox(targetElement){
        if(targetElement.checked){
            await this.insertLipSync();
            targetElement.checked = true;
        }else{
            await this.parentPresenter.deleteCommand("","lipsync");
            targetElement.checked = false;
        }
    }
    async insertVideo(){
        await this.parentPresenter.openInsertAttachmentModal("", "video");
        this.invalidate();
    }
    async deleteVideo(){
        await this.parentPresenter.deleteCommand("","video");
        this.invalidate();
    }
    async insertLipSync(targetElement) {
        let commands = this.parentPresenter.element.querySelector('.paragraph-commands');
        if (commands.tagName === "DIV") {
            if (this.parentPresenter.paragraph.commands.lipsync) {
                await this.parentPresenter.handleCommand("lipsync", "changed");
            } else {
                this.parentPresenter.paragraph.commands.lipsync = {};
                await this.parentPresenter.handleCommand("lipsync", "new");
            }
            await documentModule.updateParagraphCommands(assistOS.space.id, this.parentPresenter._document.id, this.parentPresenter.paragraph.id, this.parentPresenter.paragraph.commands);
            await this.parentPresenter.renderViewModeCommands();
        } else {
            const currentCommandsString = commands.value.replace(/\n/g, "");
            commands.value = `${currentCommandsString}` + "\n" + utilModule.buildCommandString("lipsync", {});
            commands.style.height = commands.scrollHeight + 'px';
        }
        this.parentPresenter.showUnfinishedTasks();
    }
}