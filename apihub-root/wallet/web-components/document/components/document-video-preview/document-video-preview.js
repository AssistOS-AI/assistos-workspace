const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});
export class DocumentVideoPreview {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.parentPresenter = this.element.closest("document-view-page").webSkelPresenter;
        this.document = this.parentPresenter._document;
        this.invalidate(async ()=>{
            this.videoLength = await documentModule.estimateDocumentVideoLength(assistOS.space.id, this.document.id);
        });
    }

    beforeRender() {
        //open chapters if they are closed
        for(let chapter of this.document.chapters){
            let chapterPresenter = this.parentPresenter.element.querySelector(`[data-chapter-id="${chapter.id}"]`).webSkelPresenter;
            if(chapterPresenter.chapter.visibility === "hide"){
                chapterPresenter.changeChapterVisibility("show");
            }
        }
        this.durationHTML = this.formatTime(this.videoLength);
        this.currentTime = 0;
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
        this.currentChapterNumber = this.element.querySelector(".chapter-number");
        this.currentParagraphNumber = this.element.querySelector(".paragraph-number");
        this.currentTimeElement = this.element.querySelector(".current-time");

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
        if(!this.boundDisplayCurrentTime){
            this.boundDisplayCurrentTime = this.displayCurrentTime.bind(this);
            this.audioPlayer.addEventListener("timeupdate", this.boundDisplayCurrentTime);
        }
        if(!this.boundIncrementTimestamp){
            this.boundIncrementTimestamp = this.incrementTimestamp.bind(this);
        }
        this.setCurrentParagraphAndChapter(0, 0);
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
    formatTime(seconds){
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        let remainingSeconds = Math.floor(seconds % 60);
        remainingSeconds = String(remainingSeconds).padStart(2, '0');

        if(hours > 0){
            return `${hours}:${minutes}:${remainingSeconds}`;
        }
        return `${minutes}:${remainingSeconds}`;
    }

    displayCurrentTime(){
        this.currentTimeElement.innerHTML = this.formatTime(this.currentTime + this.audioPlayer.currentTime);
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
            let playPause = this.element.querySelector(".play-pause");
            playPause.setAttribute("data-local-action", "playPause");
            let mode = playPause.getAttribute("data-mode");

            if(!this.isPaused && mode !== "playFromBeginning"){
                this.audioPlayer.play();
            }
            //remove loader callback
            clearTimeout(this.loaderTimeout);
            delete this.loaderTimeout;

            if(mode === "play"){
                playPause.innerHTML = `<img class="pointer" src="./wallet/assets/icons/pause.svg" alt="pause">`;
            } else if(mode === "pause" || mode === "playFromBeginning"){
                playPause.innerHTML = `<img class="pointer" src="./wallet/assets/icons/play.svg" alt="play">`;
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
            //dont show loader if silence
            if(this.silenceTimeout){
                return;
            }

            let playPause = this.element.querySelector(".play-pause");
            playPause.removeAttribute("data-local-action");
            playPause.innerHTML = `<div class="loading-icon"><div>`;
        }, 500);
    }
    decrementParagraphIndex(){
        this.paragraphIndex -= 1;
        if(this.paragraphIndex < 0){
            this.chapterIndex -= 1;
            this.paragraphIndex = this.document.chapters[this.chapterIndex].paragraphs.length - 1;
        }
        if(this.chapterIndex < 0){
            console.log("reached start of document");
        }
    }
    incrementParagraphIndex(){
        this.paragraphIndex += 1;
        if(this.paragraphIndex === this.document.chapters[this.chapterIndex].paragraphs.length){
            this.chapterIndex += 1;
            this.paragraphIndex = 0;
        }
        if(this.chapterIndex === this.document.chapters.length){
            console.log("reached end of document");
        }
    }
    incrementParagraphIndexAndPlay(){
        this.currentTime += this.audioPlayer.duration;
        this.incrementParagraphIndex();
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
        } else if(mode === "reload" || mode === "playFromBeginning"){
            imgTag = `<img class="pointer" src="./wallet/assets/icons/pause.svg" alt="pause">`;
            mode = "play";
            this.nextButton.classList.remove("disabled");
            this.previousButton.classList.remove("disabled");
            this.setCurrentParagraphAndChapter(0, 0);
            this.currentFrame = {
                imageSrc: "",
                audioSrc: ""
            };
            this.audioLoaded = false;
            this.imageLoaded = false;
            this.currentTime = 0;
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            this.playNext();
        }
        targetElement.innerHTML = imgTag;
        targetElement.setAttribute("data-mode", mode);
    }
    pauseVideo(){
        this.audioPlayer.pause();
        this.isPaused = true;
        if (this.silenceTimeout) {
            clearInterval(this.incrementTimeInterval);
            clearTimeout(this.silenceTimeout);
            delete this.silenceTimeout;
            delete this.incrementTimeInterval;

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
            this.incrementTimeInterval = setInterval(this.boundIncrementTimestamp, 1000);
            this.silenceTimeout = setTimeout(async () => {
                clearInterval(this.incrementTimeInterval);
                delete this.incrementTimeInterval;
                delete this.silenceTimeout;
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
                    this.setCurrentParagraphAndChapter(i, j);

                } else if (paragraph.audio) {
                    this.setCurrentParagraphAndChapter(i, j);

                    this.loadResource("audio", paragraph.audio.src);
                    this.scrollDocument();
                    if(!this.currentFrame.imageSrc){
                        this.loadResource("image", "./wallet/assets/images/black-screen.png");
                    }
                    return;
                } else {
                    let command = utilModule.findCommand(paragraph.text);
                    if (command.action === "createSilentAudio") {
                        this.setCurrentParagraphAndChapter(i, j);
                        this.executeSilenceCommand(command);
                        return;
                    }
                }
            }
        }
        //reached end of document
        this.prepareVideoForReload();
    }
    setCurrentParagraphAndChapter(chapterIndex, paragraphIndex){
        this.chapterIndex = chapterIndex;
        this.paragraphIndex = paragraphIndex;

        this.currentChapterNumber.innerHTML = chapterIndex + 1;
        this.currentParagraphNumber.innerHTML = paragraphIndex + 1;
    }
    prepareVideoForReload(){
        let playButton = this.element.querySelector(".play-pause");
        playButton.setAttribute("data-mode", "reload");
        playButton.innerHTML = `<img class="pointer" src="./wallet/assets/icons/refresh.svg" alt="reload">`;
        this.isPaused = false;
        this.parentPresenter.toggleEditingState(true);
        this.nextButton.classList.add("disabled");
        this.currentTime = this.videoLength;
        //end of the player changes the time to 0
        setTimeout(()=>{
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
        }, 100);
    }
    executeSilenceCommand(command) {
        this.silenceDuration = command.paramsObject.duration * 1000;
        this.silenceStartTime = Date.now();
        if(!this.imageTag.src){
            this.loadResource("image", "./wallet/assets/images/black-screen.png");
        }
        this.incrementTimeInterval = setInterval(this.boundIncrementTimestamp, 1000);

        this.silenceTimeout = setTimeout(async ()=>{
            clearInterval(this.incrementTimeInterval);
            delete this.incrementTimeInterval;
            this.remainingSilentDuration = 0;
            this.incrementParagraphIndex();
            delete this.silenceTimeout;
            this.playNext();
        },this.silenceDuration);
    }
    incrementTimestamp(){
        this.currentTime += 1;
        this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
    }
    skipToNextScene(targetElement) {
        this.cancelTimeouts();
        this.previousButton.classList.remove("disabled");
        this.incrementParagraphIndex();
        let playPause = this.element.querySelector(".play-pause");
        let currentMode = playPause.getAttribute("data-mode");
        //skip to the next scene with audio
        let silenceTimeSkipped = 0;
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
                    this.setCurrentParagraphAndChapter(i, j);
                    this.nextButton.classList.add("disabled");
                    this.audioPlayer.addEventListener("loadedmetadata", this.skipTimeStamp.bind(this, silenceTimeSkipped), {once: true});
                    this.loadResource("image", this.currentFrame.imageSrc || "./wallet/assets/images/black-screen.png");
                    if(currentMode === "play"){
                        this.playNext();
                        return;
                    }
                    //player is paused
                    this.loadResource("audio", paragraph.audio.src);
                    this.scrollDocument();
                    return;

                } else {
                    let command = utilModule.findCommand(paragraph.text);
                    if (command.action === "createSilentAudio") {
                        this.setCurrentParagraphAndChapter(i, j);
                        if(command.paramsObject.duration){
                            silenceTimeSkipped += parseFloat(command.paramsObject.duration);
                        }
                    }
                }
            }
        }
        //reached end of document
        this.audioPlayer.pause();
        this.prepareVideoForReload();
    }
    skipTimeStamp(silenceTimeSkipped, event){
        this.nextButton.classList.remove("disabled");
        this.currentTime = this.currentTime + (this.audioPlayer.duration - this.audioPlayer.currentTime) + silenceTimeSkipped;
        this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
    }
    cancelTimeouts(){
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
        //stop incrementing timestamp
        if(this.incrementTimeInterval){
            clearInterval(this.incrementTimeInterval);
            delete this.incrementTimeInterval;
        }
    }
    async skipToPreviousScene(targetElement) {
        this.cancelTimeouts();
        this.decrementParagraphIndex();
        let playPause = this.element.querySelector(".play-pause");
        let currentMode = playPause.getAttribute("data-mode");
        //skip previous is called at the end of the document
        if(currentMode === "reload"){
            playPause.setAttribute("data-mode", "play");
            playPause.innerHTML = `<img class="pointer" src="./wallet/assets/icons/pause.svg" alt="pause">`;
            this.nextButton.classList.remove("disabled");
            currentMode = "play";
        }

        //skip to the previous scene with audio
        let silenceTimeSkipped = 0;
        for(let i = this.chapterIndex; i >= 0; i--){
            let chapter = this.document.chapters[i];
            for(let j = this.paragraphIndex; j >= 0; j--){
                let paragraph = chapter.paragraphs[j];
                if(paragraph.audio){
                    this.setCurrentParagraphAndChapter(i, j);
                    this.currentFrame.audioSrc = paragraph.audio.src;
                    this.currentFrame.imageSrc = this.findPreviousFrameImage();

                    this.audioPlayer.addEventListener("loadedmetadata", ()=>{
                        this.previousButton.classList.remove("disabled");
                    }, {once: true});
                    this.previousButton.classList.add("disabled");
                    this.currentTime -= (this.audioPlayer.duration + silenceTimeSkipped);
                    this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);

                    this.loadResource("image", this.currentFrame.imageSrc);
                    if(currentMode === "play"){
                        this.playNext();
                        return;
                    }
                    //player is paused
                    this.loadResource("audio", paragraph.audio.src);
                    this.audioPlayer.load();
                    this.scrollDocument();
                    return;
                } else if(paragraph.image){
                    //do nothing
                } else {
                    let command = utilModule.findCommand(paragraph.text);
                    if (command.action === "createSilentAudio") {
                        this.setCurrentParagraphAndChapter(i, j);
                        if(command.paramsObject.duration){
                            silenceTimeSkipped += parseFloat(command.paramsObject.duration);
                        }
                    }
                }
            }
        }

        //reached start of document
        this.loadResource("image", "./wallet/assets/images/black-screen.png");
        this.setCurrentParagraphAndChapter(0, 0);
        this.audioPlayer.currentTime = 0;
        this.currentFrame = {
            imageSrc: "",
            audioSrc: ""
        }
        this.previousButton.classList.add("disabled");

        this.resetTimestamp();
        //pause the video at the beginning
        playPause.setAttribute("data-mode", "play");
        await this.playPause(playPause);
        playPause.setAttribute("data-mode", "playFromBeginning");
        this.isPaused = false;
    }
    resetTimestamp(){
        clearInterval(this.incrementTimeInterval);
        delete this.incrementTimeInterval;
        this.currentTimeElement.innerHTML = this.formatTime(0);
        this.currentTime = 0;
    }
    findPreviousFrameImage(){
        let previousParagraphIndex = this.paragraphIndex - 1;
        let chapterIndex = this.chapterIndex;
        if(previousParagraphIndex < 0){
            chapterIndex -= 1;
        }
        if(chapterIndex < 0){
            console.log("reached start of document");
        }
        for(let i = chapterIndex; i >= 0; i--){
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
    scrollDocument(){
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
    switchDisplayMode(targetElement){
        let currentMode = targetElement.getAttribute("data-mode");
        if(currentMode === "minimized"){
            targetElement.setAttribute("data-mode", "fullscreen");
            this.element.classList.remove("minimized");
            this.element.classList.add("fullscreen");
        } else {
            targetElement.setAttribute("data-mode", "minimized");
            this.element.classList.add("minimized");
            this.element.classList.remove("fullscreen");
        }
    }
}