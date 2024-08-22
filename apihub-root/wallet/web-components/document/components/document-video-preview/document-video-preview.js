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
        for(let chapter of this.document.chapters){
            let chapterPresenter = this.parentPresenter.element.querySelector(`[data-chapter-id="${chapter.id}"]`).webSkelPresenter;
            if(chapterPresenter.chapter.visibility === "hide"){
                chapterPresenter.changeChapterVisibility("show");
            }
        }
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
        this.nextButton = this.element.querySelector(".next");
        this.previousButton = this.element.querySelector(".previous");
        if (!this.boundPlayNext) {
            this.boundPlayNext = this.incrementParagraphIndexAndPlay.bind(this);
            this.audioPlayer.addEventListener("ended", this.boundPlayNext);
        }
        if(!this.boundCheckImageLoaded){
            this.boundCheckImageLoaded = this.checkImageLoaded.bind(this);
            this.imageTag.addEventListener("load", this.boundCheckImageLoaded);
        }
        if(!this.boundCheckAudioLoaded){
            this.boundCheckAudioLoaded = this.checkAudioLoaded.bind(this);
            this.audioPlayer.addEventListener("canplay", this.boundCheckAudioLoaded);
        }
        this.chapterIndex = 0;
        this.paragraphIndex = 0;
        this.loadResource("image", "./wallet/assets/images/black-screen.png");
        this.parentPresenter.toggleEditingState(false);
        this.currentFrame= {
            imageSrc: "",
            audioSrc: ""
        };
        this.imageLoaded = true;
        this.audioLoaded = true;
        this.playNext();
    }
    afterUnload(){
        this.audioPlayer.pause();
        this.audioPlayer.removeEventListener("ended", this.boundPlayNext);
        this.audioPlayer.removeEventListener("canplay", this.boundCheckAudioLoaded);
        this.imageTag.removeEventListener("load", this.boundCheckImageLoaded);
    }
    checkImageLoaded(){
        this.imageLoaded = true;
        this.removeLoader();
    }
    checkAudioLoaded(){
        this.audioLoaded = true;
        this.removeLoader();
    }
    removeLoader(){
        if(this.imageLoaded && this.audioLoaded){
            if(!this.isPaused){
                this.audioPlayer.play();
            }
            let playPause = this.element.querySelector(".play-pause");
            playPause.setAttribute("data-local-action", "playPause");
            let mode = playPause.getAttribute("data-mode");
            //remove loader callback
            clearTimeout(this.loaderTimeout);
            delete this.loaderTimeout;

            if(mode === "play"){
                playPause.innerHTML = `<img class="pointer" src="./wallet/assets/icons/pause.svg" alt="pause">`;
            } else if(mode === "pause"){
                playPause.innerHTML = `<img class="pointer" src="./wallet/assets/icons/play.svg" alt="play">`;
            } else if(mode === "reload"){
                playPause.innerHTML = `<img class="pointer" src="./wallet/assets/icons/refresh.svg" alt="reload">`;
            }
        }
    }

    //call this when setting src
    loadResource(type, src){
        if(type === "image"){
            this.imageLoaded = false;
            this.imageTag.src = src;
        } else {
            this.audioLoaded = false;
            this.audioPlayer.src = src;
            this.audioPlayer.load();
        }
        if(this.loaderTimeout){
            return;
        }
        this.loaderTimeout = setTimeout(()=>{
            let playPause = this.element.querySelector(".play-pause");
            playPause.removeAttribute("data-local-action");
            playPause.innerHTML = `<div class="loading-icon"><div>`;
        }, 500);
    }

    incrementParagraphIndexAndPlay(){
        this.paragraphIndex += 1;
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
            this.nextButton.classList.remove("disabled");
            this.previousButton.classList.remove("disabled");
            this.chapterIndex = 0;
            this.paragraphIndex = 0;
            this.currentFrame = {
                imageSrc: "",
                audioSrc: ""
            };
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
        for (let i = this.chapterIndex; i < this.document.chapters.length; i++) {
            let chapter = this.document.chapters[i];
            for (let j = this.paragraphIndex; j < chapter.paragraphs.length; j++) {
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
                    this.loadResource("image", paragraph.image.src);
                    this.chapterIndex = i;
                    this.paragraphIndex = j;
                } else if (paragraph.audio) {
                    this.chapterIndex = i;
                    this.paragraphIndex = j;
                    this.loadResource("audio", paragraph.audio.src);
                    this.handlePlayMode();
                    if(!this.currentFrame.imageSrc){
                        this.loadResource("image", "./wallet/assets/images/black-screen.png");
                    }
                    return;
                } else {
                    let command = utilModule.findCommand(paragraph.text);
                    if (command.action === "createSilentAudio") {
                        this.chapterIndex = i;
                        this.paragraphIndex = j;
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
        playButton.innerHTML = `<img class="pointer" src="./wallet/assets/icons/refresh.svg" alt="reload">`;
        this.isPaused = false;
        this.parentPresenter.toggleEditingState(true);
        this.nextButton.classList.add("disabled");
    }
    executeSilenceCommand(command) {
        this.silenceDuration = command.paramsObject.duration * 1000;
        this.silenceStartTime = Date.now();
        if(!this.imageTag.src){
            this.loadResource("image", "./wallet/assets/images/black-screen.png");
        }
        this.silenceTimeout = setTimeout(async ()=>{
            this.remainingSilentDuration = 0;
            this.paragraphIndex += 1;
            await this.playNext();
        },this.silenceDuration);
    }
    skipToNextScene(targetElement) {
        this.previousButton.classList.remove("disabled");
        this.paragraphIndex += 1;
        let playPause = this.element.querySelector(".play-pause");
        let currentMode = playPause.getAttribute("data-mode");

        //skip during loading of a scene
        if(this.loaderTimeout){
            clearTimeout(this.loaderTimeout);
            delete this.loaderTimeout;
            this.imageLoaded = true;
            this.audioLoaded = true;
        }
        //skip during pause
        if(this.silenceTimeout){
            clearTimeout(this.silenceTimeout);
            delete this.silenceTimeout;
            this.remainingSilentDuration = 0;
        }
        //skip to the next scene with audio
        for(let i = this.chapterIndex; i < this.document.chapters.length; i++){
            let chapter = this.document.chapters[i];
            for(let j = this.paragraphIndex; j < chapter.paragraphs.length; j++){
                let paragraph = chapter.paragraphs[j];
                if(paragraph.image){
                    this.currentFrame = {
                        imageSrc: paragraph.image.src,
                        audioSrc: ""
                    }
                } else if(paragraph.audio){
                    this.chapterIndex = i;
                    this.paragraphIndex = j;
                    this.loadResource("image", this.currentFrame.imageSrc || "./wallet/assets/images/black-screen.png");
                    if(currentMode === "play"){
                        this.playNext();
                        return;
                    }
                    this.loadResource("audio", paragraph.audio.src);
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
    async skipToPreviousScene(targetElement) {
        this.paragraphIndex -= 1;
        let playPause = this.element.querySelector(".play-pause");
        let currentMode = playPause.getAttribute("data-mode");
        //skip previous is called at the end of the document
        if(currentMode === "reload"){
            playPause.setAttribute("data-mode", "play");
            playPause.innerHTML = `<img class="pointer" src="./wallet/assets/icons/pause.svg" alt="pause">`;
            this.nextButton.classList.remove("disabled");
            currentMode = "play";
        }
        //skip during loading of a scene
        if(this.loaderTimeout){
            clearTimeout(this.loaderTimeout);
            delete this.loaderTimeout;
            this.imageLoaded = true;
            this.audioLoaded = true;
        }
        //skip during pause
        if(this.silenceTimeout){
            delete this.silenceTimeout;
            clearTimeout(this.silenceTimeout);
            this.remainingSilentDuration = 0;
        }
        //skip to the previous scene with audio
        for(let i = this.chapterIndex; i >= 0; i--){
            let chapter = this.document.chapters[i];
            for(let j = this.paragraphIndex; j >= 0; j--){
                let paragraph = chapter.paragraphs[j];
                if(paragraph.audio){
                    this.chapterIndex = i;
                    this.paragraphIndex = j;
                    this.currentFrame.audioSrc = paragraph.audio.src;
                    this.currentFrame.imageSrc = this.findPreviousFrameImage();
                    this.loadResource("image", this.currentFrame.imageSrc);
                    if(currentMode === "play"){
                        this.playNext();
                        return;
                    }
                    this.loadResource("audio", paragraph.audio.src);
                    this.audioPlayer.load();
                    this.handlePlayMode();
                    //player is paused
                    return;

                }
            }
        }
        //reached start of document
        this.loadResource("image", "./wallet/assets/images/black-screen.png");
        this.chapterIndex = 0;
        this.paragraphIndex = 0;
        this.audioPlayer.currentTime = 0;
        this.currentFrame = {
            imageSrc: "",
            audioSrc: ""
        }
        this.previousButton.classList.add("disabled");

        //pause the video at the beginning
        playPause.setAttribute("data-mode", "play");
        await this.playPause(playPause);
        playPause.setAttribute("data-mode", "reload");
        this.isPaused = false;
    }
    findPreviousFrameImage(){
        let previousParagraphIndex = this.paragraphIndex - 1;
        for(let i = this.chapterIndex; i >= 0; i--){
            let chapter = this.document.chapters[i];
            for(let j = previousParagraphIndex; j >= 0; j--){
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
            let chapter = this.document.chapters[this.chapterIndex];
            let paragraph = chapter.paragraphs[this.paragraphIndex];
            let currentParagraph = this.parentPresenter.element.querySelector(`[data-paragraph-id="${paragraph.id}"]`);
            if(!currentParagraph){
                return;
            }
            if(this.paragraphIndex === chapter.paragraphs.length - 1){
                return currentParagraph.scrollIntoView({behavior: "smooth", block: "nearest"});
            }
            currentParagraph.scrollIntoView({behavior: "smooth", block: "center"});
        }
    }
}