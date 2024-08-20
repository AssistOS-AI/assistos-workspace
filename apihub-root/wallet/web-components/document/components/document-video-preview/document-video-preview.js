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
        this.imageTag = this.element.querySelector(".current-image");
        if (!this.boundPlayNext) {
            this.boundPlayNext = this.incrementParagraphIndexAndPlay.bind(this);
            this.audioPlayer.addEventListener("ended", this.boundPlayNext);
        }
        this.chapter = this.document.chapters[0];
        this.paragraph = this.chapter.paragraphs[0];
        this.imageTag.src = "./wallet/assets/images/black-screen.png";
        this.parentPresenter.toggleEditingState(false);
        this.currentFrame= {
            imageSrc: "",
            audioSrc: ""
        };
        this.playNext();
    }
    incrementParagraphIndexAndPlay(){
        let currentParagraphIndex = this.chapter.paragraphs.indexOf(this.paragraph);
        this.paragraph = this.chapter.paragraphs[currentParagraphIndex + 1];
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
            let nextButton = this.element.querySelector(".next");
            nextButton.classList.remove("disabled");
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
                    if(!this.currentFrame.audioSrc && this.currentFrame.imageSrc){
                        await this.wait(250);
                    }
                    this.currentFrame = {
                        imageSrc: paragraph.image.src,
                        audioSrc: ""
                    }
                    this.imageTag.src = paragraph.image.src;
                    this.chapter = chapter;
                    this.paragraph = chapter.paragraphs[j];
                } else if (paragraph.audio) {
                    this.chapter = chapter;
                    this.paragraph = chapter.paragraphs[j];
                    this.audioPlayer.src = paragraph.audio.src;
                    this.audioPlayer.load();
                    this.audioPlayer.play();
                    this.currentFrame.audioSrc = paragraph.audio.src;
                    this.handlePlayMode();
                    if(!this.currentFrame.imageSrc){
                        this.imageTag.src = "./wallet/assets/images/black-screen.png";
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
        this.isPaused = false;
        this.parentPresenter.toggleEditingState(true);
        this.currentFrame = {
            imageSrc: "",
            audioSrc: ""
        };
        let nextButton = this.element.querySelector(".next");
        nextButton.classList.add("disabled");
    }
    executeSilenceCommand(command) {
        this.silenceDuration = command.paramsObject.duration * 1000;
        this.silenceStartTime = Date.now();
        if(!this.imageTag.src){
            this.imageTag.src = "./wallet/assets/images/black-screen.png";
        }
        this.silenceTimeout = setTimeout(async ()=>{
            this.remainingSilentDuration = 0;
            await this.playNext();
        },this.silenceDuration);
    }
    skipToNextScene(targetElement) {
        let currentChapterIndex = this.document.chapters.indexOf(this.chapter);
        let currentParagraphIndex = this.chapter.paragraphs.indexOf(this.paragraph) + 1;
        let playPause = this.element.querySelector(".play-pause");
        let currentMode = playPause.getAttribute("data-mode");
        if(this.silenceTimeout){
            delete this.silenceTimeout;
            clearTimeout(this.silenceTimeout);
            this.remainingSilentDuration = 0;
        }
        //skip to the next scene with audio
        for(let i = currentChapterIndex; i < this.document.chapters.length; i++){
            let chapter = this.document.chapters[i];
            for(let j = currentParagraphIndex; j < chapter.paragraphs.length; j++){
                let paragraph = chapter.paragraphs[j];
                if(paragraph.image){
                    this.currentFrame = {
                        imageSrc: paragraph.image.src,
                        audioSrc: ""
                    }
                } else if(paragraph.audio){
                    this.chapter = chapter;
                    this.paragraph = paragraph;
                    this.imageTag.src = this.currentFrame.imageSrc || "./wallet/assets/images/black-screen.png";
                    if(currentMode === "play"){
                        this.playNext();
                        return;
                    }
                    this.audioPlayer.src = paragraph.audio.src;
                    this.audioPlayer.load();
                    this.handlePlayMode();
                    //player is paused
                    return;

                }
            }
        }
        //reached end of document
        this.audioPlayer.pause();
        this.prepareVideoForReload();
    }
    skipToPreviousScene(targetElement) {
        let currentChapterIndex = this.document.chapters.indexOf(this.chapter);
        let currentParagraphIndex = this.chapter.paragraphs.indexOf(this.paragraph) - 1;
        let playPause = this.element.querySelector(".play-pause");
        let currentMode = playPause.getAttribute("data-mode");
        if(this.silenceTimeout){
            delete this.silenceTimeout;
            clearTimeout(this.silenceTimeout);
            this.remainingSilentDuration = 0;
        }
        //skip to the previous scene with audio
        for(let i = currentChapterIndex; i >= 0; i--){
            let chapter = this.document.chapters[i];
            for(let j = currentParagraphIndex; j >= 0; j--){
                let paragraph = chapter.paragraphs[j];
                if(paragraph.audio){
                    this.chapter = chapter;
                    this.paragraph = paragraph;
                    this.currentFrame.audioSrc = paragraph.audio.src;
                    this.currentFrame.imageSrc = this.findPreviousFrameImage();
                    this.imageTag.src = this.currentFrame.imageSrc;
                    if(currentMode === "play"){
                        this.playNext();
                        return;
                    }
                    this.audioPlayer.src = paragraph.audio.src;
                    this.audioPlayer.load();
                    this.handlePlayMode();
                    //player is paused
                    return;

                }
            }
        }
        //reached start of document
        this.chapter = this.document.chapters[0];
        this.paragraph = this.chapter.paragraphs[0];
        this.audioPlayer.currentTime = 0;
    }
    findPreviousFrameImage(){
        let currentChapterIndex = this.document.chapters.indexOf(this.chapter);
        let currentParagraphIndex = this.chapter.paragraphs.indexOf(this.paragraph) - 1;
        for(let i = currentChapterIndex; i >= 0; i--){
            let chapter = this.document.chapters[i];
            for(let j = currentParagraphIndex; j >= 0; j--){
                let paragraph = chapter.paragraphs[j];
                if(paragraph.image){
                    return paragraph.image.src;
                }
            }
        }
        return "./wallet/assets/images/black-screen.png";
    }
    floatVideo(targetElement) {
        if(this.isFloating){
            this.isFloating = false;
            this.element.style.position = "initial";
            this.element.style.zIndex = "0";
            this.element.style.top = "initial";
            this.element.style.left = "initial";
        } else {
            this.isFloating = true;
            this.element.style.position = "absolute";
            this.element.style.zIndex = "999";
            this.element.style.top = "25%";
            this.element.style.left = "13%";
            this.handlePlayMode();
        }

    }
    handlePlayMode(){
        if(this.isFloating){
            let currentParagraphIndex = this.chapter.paragraphs.indexOf(this.paragraph);
            let currentParagraph = this.parentPresenter.element.querySelector(`[data-paragraph-id="${this.paragraph.id}"]`);
            if(currentParagraphIndex === this.chapter.paragraphs.length - 1){
                return currentParagraph.scrollIntoView({behavior: "smooth", block: "nearest"});
            }
            currentParagraph.scrollIntoView({behavior: "smooth", block: "center"});
        }
    }
}