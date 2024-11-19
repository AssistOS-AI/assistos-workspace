import {videoUtils} from "../../../../imports.js";
const spaceModule = require("assistos").loadModule("space", {});
const documentModule = require("assistos").loadModule("document", {});
export class VideoMenu{
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
        let viewVideoSection = this.element.querySelector(".view-section");
        let deleteVideoButton = this.element.querySelector(".delete-video");
        let lipSyncCheckbox = this.element.querySelector("#lip-sync");
        if(this.parentPresenter.paragraph.commands.video){
            viewVideoSection.classList.remove("hidden");
            deleteVideoButton.classList.remove("hidden");
            await this.initViewVideo();
            this.initDurationInputs();
        }
        let commands = this.parentPresenter.paragraph.commands;
        let disableLipSync = false;
        if(!commands.video && !commands.image){
            let warnMessage = `No visual source added`;
            this.showLipSyncWarning(warnMessage);
            disableLipSync = true;
        }
        if(this.parentPresenter.paragraph.commands.lipsync){
            lipSyncCheckbox.checked = true;
        }
        lipSyncCheckbox.disableLipSync = disableLipSync;
    }
    showLipSyncWarning(message){
        let warning = `
                <div class="paragraph-warning">
                    <img loading="lazy" src="./wallet/assets/icons/warning.svg" class="video-warning-icon" alt="warn">
                    <div class="warning-text">${message}</div>
                </div>`;
        let lipSyncSection = this.element.querySelector(".lip-sync-section");
        lipSyncSection.insertAdjacentHTML("afterend", warning);
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
        if(targetElement.disableLipSync){
            return
        }
        if(targetElement.checked){
            await this.insertLipSync();
            targetElement.checked = true;
        }else{
            await this.commandsEditor.deleteCommand("lipsync");
            targetElement.checked = false;
        }
    }
    async insertVideo(){
        let videoId = await this.commandsEditor.insertAttachmentCommand("video");
        if(videoId){
            if(this.parentPresenter.paragraph.commands.lipsync){
                this.parentPresenter.paragraph.commands.lipsync.videoId = videoId;
                if(this.parentPresenter.paragraph.commands.lipsync.imageId){
                    delete this.parentPresenter.paragraph.commands.lipsync.imageId;
                }
                await documentModule.updateParagraphCommands(assistOS.space.id, this.parentPresenter._document.id, this.parentPresenter.paragraph.id, this.parentPresenter.paragraph.commands);
            }
            this.invalidate();
        }
    }
    async deleteVideo(){
        await this.commandsEditor.deleteCommand("video");
        let commands = this.parentPresenter.paragraph.commands;
        if(commands.lipsync && commands.lipsync.videoId){
            await this.insertVideoSource(commands);
        }
        this.invalidate();
    }
    async insertVideoSource(commands){
        await assistOS.loadifyComponent(this.element, async () => {
            let video = document.createElement("video");
            video.crossOrigin = "anonymous";
            let videoURL = await spaceModule.getVideoURL(commands.lipsync.videoId);
            let thumbnailId = await videoUtils.uploadVideoThumbnail(videoURL, video);
            const duration = parseFloat(video.duration.toFixed(1));
            const width = video.videoWidth;
            const height = video.videoHeight;
            let data = {
                id: commands.lipsync.videoId,
                thumbnailId: thumbnailId,
                width: width,
                height: height,
                duration: duration,
                start: 0,
                end: duration,
                volume: 1
            };
            await this.commandsEditor.insertSimpleCommand("video", data);
        });
    }
    async insertLipSync(targetElement) {
        let commands = this.parentPresenter.paragraph.commands;
        let commandData = {};
        if(commands.video){
            commandData.videoId = commands.video.id;
        } else{
            commandData.imageId = commands.image.id;
        }
        await this.commandsEditor.insertCommandWithTask("lipsync", commandData);
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