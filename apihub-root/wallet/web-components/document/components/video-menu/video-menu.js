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
        let viewVideoSection = this.element.querySelector(".view-section");
        let deleteVideoButton = this.element.querySelector(".delete-video");
        let lipSyncCheckbox = this.element.querySelector("#lip-sync");
        if(this.parentPresenter.paragraph.commands.video){
            viewVideoSection.classList.remove("hidden");
            deleteVideoButton.classList.remove("hidden");
            await this.initViewVideo();
            this.initDurationInputs();
        }
        if(this.parentPresenter.paragraph.commands.lipsync){
            lipSyncCheckbox.checked = true;
        }
    }
    async initViewVideo(){
        let videoElement = this.element.querySelector("video");
        videoElement.src = await spaceModule.getVideoURL(this.parentPresenter.paragraph.commands.video.id);

        if(!this.boundHandlePlay){
            this.boundHandlePlay = this.handlePlay.bind(this, videoElement);
        }
        if(!this.boundHandleEnd){
            this.boundHandleEnd = this.handleEnd.bind(this, videoElement);
        }
        videoElement.addEventListener("play", this.boundHandlePlay);
        videoElement.addEventListener("timeupdate", this.boundHandleEnd);
    }

    initDurationInputs(){
        let startInput = this.element.querySelector("#start");
        startInput.max = this.parentPresenter.paragraph.commands.video.duration;
        this.videoStartTime = this.parentPresenter.paragraph.commands.video.start;
        startInput.value = this.videoStartTime;
        if(!this.boundHandleStartInput){
            this.boundHandleStartInput = this.handleStartInput.bind(this, startInput);
        }
        startInput.addEventListener("input", this.boundHandleStartInput);

        let endInput = this.element.querySelector("#end");
        endInput.max = this.parentPresenter.paragraph.commands.video.duration;
        this.videoEndTime = this.parentPresenter.paragraph.commands.video.end;
        endInput.value = this.videoEndTime;
        if(!this.boundHandleEndInput){
            this.boundHandleEndInput = this.handleEndInput.bind(this, endInput);
        }
        endInput.addEventListener("input", this.boundHandleEndInput);
    }

    handlePlay(videoElement, event){
        let start = this.videoStartTime;
        if (videoElement.currentTime < start) {
            videoElement.currentTime = start;
        }
    }
    handleEnd(videoElement, event){
        if (videoElement.currentTime > this.videoEndTime) {
            videoElement.pause();
            videoElement.currentTime = this.videoStartTime;
        }
    }

    async handleStartInput(input, event){
        this.videoStartTime = parseFloat(input.value);
        this.toggleSaveButton();
    }
    async handleEndInput(input, event){
        this.videoEndTime = parseFloat(input.value);
        this.toggleSaveButton();
    }
    toggleSaveButton(){
        if(this.videoStartTime !== this.parentPresenter.paragraph.commands.video.start || this.videoEndTime !== this.parentPresenter.paragraph.commands.video.end){
            let button = this.element.querySelector(".save-video-duration");
            button.classList.remove("hidden");
        } else {
            let button = this.element.querySelector(".save-video-duration");
            button.classList.add("hidden");
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

    async saveVideoDuration(targetElement){
        this.parentPresenter.paragraph.commands.video.start = this.videoStartTime;
        this.parentPresenter.paragraph.commands.video.end = this.videoEndTime;
        await documentModule.updateParagraphCommands(assistOS.space.id, this.parentPresenter._document.id, this.parentPresenter.paragraph.id, this.parentPresenter.paragraph.commands);
        this.parentPresenter.checkVideoAndAudioDuration();
        this.parentPresenter.setVideoPreviewDuration();
        targetElement.classList.add("hidden");
    }
}