const utilModule = require("assistos").loadModule("util", {});

export class DocumentVideoPreview {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.parentPresenter = this.element.closest("document-view-page").webSkelPresenter;
        this.document = this.parentPresenter._document;
    }

    beforeRender() {
    }

    showControls() {
        let controls = this.element.querySelector(".controls-mask");
        controls.style.display = "flex";
    }

    hideControls() {
        let controls = this.element.querySelector(".controls-mask");
        controls.style.display = "none";
    }

    afterRender() {
        let imageContainer = this.element.querySelector(".image-container");
        if (!this.boundShowControls) {
            this.boundShowControls = this.showControls.bind(this);
            this.boundHideControls = this.hideControls.bind(this);
            imageContainer.addEventListener("mouseover", this.boundShowControls);
            imageContainer.addEventListener("mouseout", this.boundHideControls);
        }
        this.audioPlayer = this.element.querySelector(".audio-player");
        this.imagetTag = this.element.querySelector(".current-image");
        if (!this.boundPlayNext) {
            this.boundPlayNext = this.playNext.bind(this);
            this.audioPlayer.addEventListener("ended", this.boundPlayNext);
        }
        this.chapter = this.document.chapters[0];
        this.paragraph = this.chapter.paragraphs[0];
        this.imagetTag.src = "./wallet/assets/images/black-screen.png";
        this.parentPresenter.toggleEditingState(false);
        this.playNext();
    }

    closePlayer() {
        this.parentPresenter.toggleEditingState(true);
        this.audioPlayer.pause();
        this.element.remove();
    }

    playPause(targetElement) {
        let mode = targetElement.getAttribute("data-mode");
        let imgTag;
        if (mode === "pause") {
            imgTag = `<img class="pointer" src="./wallet/assets/icons/pause.svg" alt="pause">`;
            this.resumeVideo();
            mode = "play";
            this.parentPresenter.toggleEditingState(false);
        } else if (mode === "play") {
            imgTag = `<img class="pointer" src="./wallet/assets/icons/play.svg" alt="play">`;
            this.pauseVideo();
            mode = "pause";
            this.parentPresenter.toggleEditingState(true);
        } else if(mode === "reload"){
            imgTag = `<img class="pointer" src="./wallet/assets/icons/pause.svg" alt="pause">`;
            mode = "play";
            this.playNext();
        }
        targetElement.innerHTML = imgTag;
        targetElement.setAttribute("data-mode", mode);
    }
    pauseVideo(){
        this.audioPlayer.pause();
        this.isPaused = true;
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
            const endTime = Date.now();
            const elapsedTime = endTime - this.silenceStartTime;
            if (!this.remainingSilentDuration) {
                const totalSilentDuration = this.silenceDuration || 0;

                // Calculate the remaining silent duration
                this.remainingSilentDuration = totalSilentDuration - elapsedTime;
            }
        }
        //safeguard, when you pause during silence
        if (!this.resumeCallback) {
            this.resumeCallback = () => {
                this.isPaused = false;
                this.playNext();
            };
        }
    }
    resumeVideo(){
        this.isPaused = false;
        this.audioPlayer.play();
        if (this.remainingSilentDuration > 0) {
            // Resume the silence with the remaining duration
            this.silenceStartTime = Date.now();
            this.silenceTimeout = setTimeout(async () => {
                this.remainingSilentDuration = 0; // Reset after completion
                if (this.resumeCallback) {
                    this.resumeCallback();
                    delete this.resumeCallback;
                }
            }, this.remainingSilentDuration);
        } else if(this.resumeCallback){
            //resume the video
            this.resumeCallback();
            delete this.resumeCallback;
        }
    }
    async wait(duration) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, duration);
        });
    }
    async playNext() {
        let currentChapterIndex = this.document.chapters.indexOf(this.chapter);
        let currentParagraphIndex = this.chapter.paragraphs.indexOf(this.paragraph);
        let currentFrame= {
            imageSrc: "",
            audioSrc: ""
        };
        for (let i = currentChapterIndex; i < this.document.chapters.length; i++) {
            let chapter = this.document.chapters[i];
            for (let j = currentParagraphIndex; j < chapter.paragraphs.length; j++) {
                let paragraph = chapter.paragraphs[j];
                if (this.isPaused) {
                    await new Promise(resolve => {
                        this.resumeCallback = resolve;
                    });
                }
                if (paragraph.image) {
                    if(!currentFrame.audioSrc && currentFrame.imageSrc){
                        await this.wait(250);
                    }
                    currentFrame = {
                        imageSrc: paragraph.image.src,
                        audioSrc: ""
                    }
                    this.imagetTag.src = paragraph.image.src;
                    this.chapter = chapter;
                    this.paragraph = chapter.paragraphs[j + 1];
                } else if (paragraph.audio) {
                    this.chapter = chapter;
                    this.paragraph = chapter.paragraphs[j + 1];
                    this.audioPlayer.src = paragraph.audio.src;
                    this.audioPlayer.load();
                    this.audioPlayer.play();
                    currentFrame.audioSrc = paragraph.audio.src;
                    if(!currentFrame.imageSrc){
                        this.imagetTag.src = "./wallet/assets/images/black-screen.png";
                    }
                    return;
                } else {
                    let command = utilModule.findCommand(paragraph.text);
                    if (command.action === "createSilentAudio") {
                        this.chapter = chapter;
                        this.paragraph = chapter.paragraphs[j + 1];
                        this.executeSilenceCommand(command);
                        return;
                    }
                }
            }
        }
        //reached end of document
        this.prepareVideoForReload();
    }
    prepareVideoForReload(){
        let playButton = this.element.querySelector(".play-pause");
        playButton.setAttribute("data-mode", "reload");
        playButton.innerHTML = `<img class="pointer" src="./wallet/assets/icons/refresh.svg" alt="refresh">`;
        this.chapter = this.document.chapters[0];
        this.paragraph = this.chapter.paragraphs[0];
        this.parentPresenter.toggleEditingState(true);
    }
    executeSilenceCommand(command) {
        this.silenceDuration = command.paramsObject.duration * 1000;
        this.silenceStartTime = Date.now();
        if(!this.imagetTag.src){
            this.imagetTag.src = "./wallet/assets/images/black-screen.png";
        }
        this.silenceTimeout = setTimeout(async ()=>{
            this.remainingSilentDuration = 0;
            await this.playNext();
        },this.silenceDuration);
    }
    skipToNextScene(targetElement) {
        let currentChapterIndex = this.document.chapters.indexOf(this.chapter);
        let currentParagraphIndex = this.chapter.paragraphs.indexOf(this.paragraph);
        let playPause = this.element.querySelector(".play-pause");
        let currentMode = playPause.getAttribute("data-mode");
        let currentImageSrc;
        //skip to the next scene with audio
        for(let i = currentChapterIndex; i < this.document.chapters.length; i++){
            let chapter = this.document.chapters[i];
            for(let j = currentParagraphIndex; j < chapter.paragraphs.length; j++){
                let paragraph = chapter.paragraphs[j];
                if(paragraph.image){
                    currentImageSrc = paragraph.image.src;
                } else if(paragraph.audio){
                    this.chapter = chapter;
                    this.paragraph = paragraph;
                    this.imagetTag.src = currentImageSrc;
                    if(currentMode === "play"){
                        this.playNext();
                        return;
                    } else {
                        this.audioPlayer.src = paragraph.audio.src;
                        this.audioPlayer.load();
                        return;
                    }
                }
            }
        }
        //reached end of document
        this.audioPlayer.currentTime = this.audioPlayer.duration;
        this.prepareVideoForReload();
    }
    skipToPreviousScene(targetElement) {
        let currentChapterIndex = this.document.chapters.indexOf(this.chapter);
        let currentParagraphIndex = this.chapter.paragraphs.indexOf(this.paragraph);
        let playPause = this.element.querySelector(".play-pause");
        let currentMode = playPause.getAttribute("data-mode");
        let currentImageSrc;
        this.audioPlayer.pause();
        for(let i = currentChapterIndex; i >= 0 ; i--){
            let chapter = this.document.chapters[i];
            for(let j = currentParagraphIndex; j >= 0; j--){
                let paragraph = chapter.paragraphs[j];
                if(paragraph.image){
                    currentImageSrc = paragraph.image.src;
                } else if(paragraph.audio){
                    this.chapter = chapter;
                    this.paragraph = paragraph;
                    if(currentMode === "play"){
                        this.playNext();
                        return;
                    } else {
                        this.imagetTag.src = currentImageSrc;
                        this.audioPlayer.src = paragraph.audio.src;
                        this.audioPlayer.load();
                        return;
                    }
                }
            }
        }
        //reached start of document
        this.chapter = this.document.chapters[0];
        this.paragraph = this.chapter.paragraphs[0];
        this.audioPlayer.currentTime = 0;
    }
}