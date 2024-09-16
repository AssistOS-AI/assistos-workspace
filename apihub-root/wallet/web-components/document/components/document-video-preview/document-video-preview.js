import {executorTimer} from "../../../../imports.js";
const documentModule = require("assistos").loadModule("document", {});

export class DocumentVideoPreview {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.parentPresenter = this.element.closest("document-view-page").webSkelPresenter;
        this.document = this.parentPresenter._document;
        this.invalidate(async () => {
            this.videoLength = await documentModule.estimateDocumentVideoLength(assistOS.space.id, this.document.id);
        });
    }

    beforeRender() {
        //open chapters if they are closed
        for (let chapter of this.document.chapters) {
            let chapterPresenter = this.parentPresenter.element.querySelector(`[data-chapter-id="${chapter.id}"]`).webSkelPresenter;
            if (chapterPresenter.chapter.visibility === "hide") {
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
        if (!this.boundCheckImageLoaded) {
            this.boundCheckImageLoaded = this.checkImageLoaded.bind(this);
            this.imageTag.addEventListener("load", this.boundCheckImageLoaded);
        }
        if (!this.boundCheckAudioLoaded) {
            this.boundCheckAudioLoaded = this.checkAudioLoaded.bind(this);
            this.audioPlayer.addEventListener("canplay", this.boundCheckAudioLoaded);
        }
        if (!this.boundDisplayCurrentTime) {
            this.boundDisplayCurrentTime = this.displayCurrentTime.bind(this);
            this.audioPlayer.addEventListener("timeupdate", this.boundDisplayCurrentTime);
        }
        if (!this.boundIncrementTimestamp) {
            this.boundIncrementTimestamp = this.incrementTimestamp.bind(this);
        }
        this.setCurrentParagraphAndChapter(0, 0);
        this.loadResource("image", "./wallet/assets/images/black-screen.png");
        this.parentPresenter.toggleEditingState(false);
        this.imageLoaded = true;
        this.audioLoaded = true;
        this.playNext();
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        let remainingSeconds = Math.floor(seconds % 60);
        remainingSeconds = String(remainingSeconds).padStart(2, '0');

        if (hours > 0) {
            return `${hours}:${minutes}:${remainingSeconds}`;
        }
        return `${minutes}:${remainingSeconds}`;
    }

    displayCurrentTime() {
        this.currentTimeElement.innerHTML = this.formatTime(this.currentTime + this.audioPlayer.currentTime);
    }

    afterUnload() {
        this.audioPlayer.pause();
        this.audioPlayer.removeEventListener("ended", this.boundPlayNext);
        this.audioPlayer.removeEventListener("canplay", this.boundCheckAudioLoaded);
        this.imageTag.removeEventListener("load", this.boundCheckImageLoaded);
    }

    checkImageLoaded() {
        this.imageLoaded = true;
        this.removeLoader();
    }

    checkAudioLoaded() {
        this.audioLoaded = true;
        this.removeLoader();
    }

    removeLoader() {
        if (this.imageLoaded && this.audioLoaded) {
            let playPause = this.element.querySelector(".play-pause");
            playPause.setAttribute("data-local-action", "playPause");
            let mode = playPause.getAttribute("data-mode");

            if (!this.isPaused && mode !== "playFromBeginning") {
                this.audioPlayer.play();
            }
            //remove loader callback
            clearTimeout(this.loaderTimeout);
            delete this.loaderTimeout;

            if (mode === "play") {
                playPause.innerHTML = `<img class="pointer" src="./wallet/assets/icons/pause.svg" alt="pause">`;
            } else if (mode === "pause" || mode === "playFromBeginning") {
                playPause.innerHTML = `<img class="pointer" src="./wallet/assets/icons/play.svg" alt="play">`;
            }
        }
    }

    //call this when setting src
    loadResource(type, src) {
        if (type === "image") {
            this.imageLoaded = false;
            this.imageTag.src = src;
        } else {
            this.audioLoaded = false;
            this.currentTime += this.audioPlayer.currentTime;
            this.audioPlayer.src = src;
            this.audioPlayer.load();
        }
        if (this.loaderTimeout) {
            return;
        }
        this.loaderTimeout = setTimeout(() => {
            //dont show loader if silence
            if (this.silenceTimeout) {
                return;
            }

            let playPause = this.element.querySelector(".play-pause");
            playPause.removeAttribute("data-local-action");
            playPause.innerHTML = `<div class="loading-icon"><div>`;
        }, 500);
    }

    decrementParagraphIndex() {
        this.paragraphIndex -= 1;
        if (this.paragraphIndex < 0) {
            this.chapterIndex -= 1;
            if(this.chapterIndex < 0){
                console.log("reached start of document");
                return;
            }
            this.paragraphIndex = this.document.chapters[this.chapterIndex].paragraphs.length - 1;
        }

    }

    incrementParagraphIndex() {
        this.paragraphIndex += 1;
        if (this.paragraphIndex === this.document.chapters[this.chapterIndex].paragraphs.length) {
            this.chapterIndex += 1;
            this.paragraphIndex = 0;
        }
        if (this.chapterIndex === this.document.chapters.length) {
            console.log("reached end of document");
        }
    }

    incrementParagraphIndexAndPlay() {
        this.currentTime += this.audioPlayer.duration;
        this.incrementParagraphIndex();
        this.playNext();
    }

    closePlayer() {
        this.parentPresenter.toggleEditingState(true);
        this.audioPlayer.pause();
        this.cancelTimeouts();
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
        } else if (mode === "reload" || mode === "playFromBeginning") {
            imgTag = `<img class="pointer" src="./wallet/assets/icons/pause.svg" alt="pause">`;
            mode = "play";
            this.nextButton.classList.remove("disabled");
            this.previousButton.classList.remove("disabled");
            this.setCurrentParagraphAndChapter(0, 0);
            this.audioLoaded = true;
            this.imageLoaded = true;
            this.currentTime = 0;
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            this.playNext();
        }
        targetElement.innerHTML = imgTag;
        targetElement.setAttribute("data-mode", mode);
    }

    pauseVideo() {
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

    resumeVideo() {
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

                if (paragraph.commands.audio) {
                    let imageSrc= "./wallet/assets/images/black-screen.png"
                    if(paragraph.commands.image){
                       imageSrc = paragraph.commands.image.src;
                    }

                    this.setCurrentParagraphAndChapter(i, j);
                    this.loadResource("image", imageSrc);
                    this.loadResource("audio", paragraph.commands.audio.src);
                    this.scrollDocument();
                    return;
                } else if (paragraph.commands["silence"]){
                    if(paragraph.commands.image){
                        this.loadResource("image", paragraph.commands.image.src);
                    } else {
                        this.loadResource("image", "./wallet/assets/images/black-screen.png");
                    }
                    this.setCurrentParagraphAndChapter(i, j);
                    let duration = paragraph.commands["silence"].paramsObject.duration;
                    this.executeSilenceCommand(duration);
                    return;
                } else if(paragraph.commands.image){
                    this.setCurrentParagraphAndChapter(i, j);
                    this.loadResource("image", paragraph.commands.image.src);
                    this.scrollDocument();
                    this.executeSilenceCommand(1);
                    return;
                }
            }
        }
        //reached end of document
        this.prepareVideoForReload();
    }

    setCurrentParagraphAndChapter(chapterIndex, paragraphIndex) {
        this.chapterIndex = chapterIndex;
        this.paragraphIndex = paragraphIndex;
        this.currentChapterNumber.innerHTML = chapterIndex + 1;
        this.currentParagraphNumber.innerHTML = paragraphIndex + 1;
    }

    prepareVideoForReload() {
        let playButton = this.element.querySelector(".play-pause");
        playButton.setAttribute("data-mode", "reload");
        playButton.innerHTML = `<img class="pointer" src="./wallet/assets/icons/refresh.svg" alt="reload">`;
        this.isPaused = false;
        this.parentPresenter.toggleEditingState(true);
        this.nextButton.classList.add("disabled");
        this.currentTime = this.videoLength;
        //end of the player changes the time to 0
        setTimeout(() => {
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
        }, 100);
    }
    executeSilenceCommand(duration) {
        this.silenceDuration = duration * 1000;
        this.silenceStartTime = Date.now();
        if (!this.imageTag.src) {
            this.loadResource("image", "./wallet/assets/images/black-screen.png");
        }
        this.incrementTimeInterval = setInterval(this.boundIncrementTimestamp, 1000);

        this.silenceTimeout = setTimeout(async () => {
            clearInterval(this.incrementTimeInterval);
            delete this.incrementTimeInterval;
            this.remainingSilentDuration = 0;
            this.incrementParagraphIndex();
            delete this.silenceTimeout;
            this.playNext();
        }, this.silenceDuration);
    }

    incrementTimestamp() {
        this.currentTime += 1;
        this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
    }

    skipToNextScene(targetElement) {
        this.cancelTimeouts();
        this.previousButton.classList.remove("disabled");
        let playPause = this.element.querySelector(".play-pause");
        let currentMode = playPause.getAttribute("data-mode");
        let paragraph = this.document.chapters[this.chapterIndex].paragraphs[this.paragraphIndex];
        this.incrementParagraphIndex();
        if (this.chapterIndex === this.document.chapters.length) {
            //reached end of document
            this.audioPlayer.pause();
            this.prepareVideoForReload();
            return;
        }
        if (paragraph.commands.audio) {
            this.nextButton.classList.add("disabled");
            this.currentTime = this.currentTime + this.audioPlayer.duration;
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            this.nextButton.classList.remove("disabled");
            this.audioPlayer.pause();
            this.audioPlayer.src = "";
            if (currentMode === "play") {
                this.playNext();
                return;
            }
            //player is paused
            this.loadResource("audio", paragraph.commands.audio.src);
            this.loadResource("image", paragraph.commands.image.src || "./wallet/assets/images/black-screen.png");
            this.scrollDocument();
        } else if (paragraph.commands["silence"]) {
            this.nextButton.classList.add("disabled");
            this.audioPlayer.pause();
            this.currentTime += parseFloat(paragraph.commands["silence"].paramsObject.duration);
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            this.nextButton.classList.remove("disabled");
            if (currentMode === "play") {
                this.playNext();
                return;
            }
            //player is paused
            this.scrollDocument();
        } else if(paragraph.commands.image){
            this.currentTime += 1;
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            if (currentMode === "play") {
                this.playNext();
                return;
            }
            //player is paused
            this.scrollDocument();
        }
    }

    cancelTimeouts() {
        //skip during loading of a scene
        if (this.loaderTimeout) {
            clearTimeout(this.loaderTimeout);
            delete this.loaderTimeout;
            this.imageLoaded = true;
            this.audioLoaded = true;
        }
        //skip during pause
        if (this.silenceTimeout) {
            delete this.silenceTimeout;
            clearTimeout(this.silenceTimeout);
            this.remainingSilentDuration = 0;
        }
        //stop incrementing timestamp
        if (this.incrementTimeInterval) {
            clearInterval(this.incrementTimeInterval);
            delete this.incrementTimeInterval;
        }
    }

    async skipToPreviousScene(targetElement) {
        this.cancelTimeouts();
        let playPause = this.element.querySelector(".play-pause");
        let currentMode = playPause.getAttribute("data-mode");
        let paragraph;
        //skip previous is called at the end of the document
        if (currentMode === "reload") {
            playPause.setAttribute("data-mode", "play");
            playPause.innerHTML = `<img class="pointer" src="./wallet/assets/icons/pause.svg" alt="pause">`;
            this.nextButton.classList.remove("disabled");
            currentMode = "play";
            this.chapterIndex = this.document.chapters.length - 1;
            this.paragraphIndex = this.document.chapters[this.document.chapters.length - 1].paragraphs.length - 1;

            let lastChapter = this.document.chapters[this.chapterIndex];
            paragraph = lastChapter.paragraphs[this.paragraphIndex];
        } else {
            paragraph = this.document.chapters[this.chapterIndex].paragraphs[this.paragraphIndex];
            this.decrementParagraphIndex();
        }

        if (this.chapterIndex < 0) {
            //reached start of document
            this.loadResource("image", "./wallet/assets/images/black-screen.png");
            this.setCurrentParagraphAndChapter(0, 0);
            this.audioPlayer.currentTime = 0;
            this.audioPlayer.src = "";
            this.previousButton.classList.add("disabled");

            this.resetTimestamp();
            //pause the video at the beginning
            playPause.setAttribute("data-mode", "play");
            await this.playPause(playPause);
            playPause.setAttribute("data-mode", "playFromBeginning");
            this.isPaused = false;
            return;
        }

        if (paragraph.commands.audio) {
            this.previousButton.classList.add("disabled");
            this.currentTime -= this.audioPlayer.duration;
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            this.previousButton.classList.remove("disabled");
            this.audioPlayer.pause();
            this.audioPlayer.src = "";
            if (currentMode === "play") {
                this.playNext();
                return;
            }
            //player is paused
            this.loadResource("audio", paragraph.commands.audio.src);
            this.scrollDocument();
        } else if (paragraph.commands["silence"]) {
            this.previousButton.classList.add("disabled");
            this.audioPlayer.pause();
            this.currentTime -= parseFloat(paragraph.commands["silence"].paramsObject.duration);
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            this.previousButton.classList.remove("disabled");
            if (currentMode === "play") {
                this.playNext();
                return;
            }
            //player is paused
            this.scrollDocument();
        } else if(paragraph.commands.image){
            this.currentTime -= 1;
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            if (currentMode === "play") {
                this.playNext();
                return;
            }
            //player is paused
            this.scrollDocument();
        }

    }

    resetTimestamp() {
        clearInterval(this.incrementTimeInterval);
        delete this.incrementTimeInterval;
        this.currentTimeElement.innerHTML = this.formatTime(0);
        this.currentTime = 0;
    }

    scrollDocument() {
        let chapter = this.document.chapters[this.chapterIndex];
        let paragraph = chapter.paragraphs[this.paragraphIndex];
        let currentParagraph = this.parentPresenter.element.querySelector(`[data-paragraph-id="${paragraph.id}"]`);
        if (!currentParagraph) {
            return;
        }
        if (this.paragraphIndex === chapter.paragraphs.length - 1) {
            return currentParagraph.scrollIntoView({behavior: "smooth", block: "nearest"});
        }
        currentParagraph.scrollIntoView({behavior: "smooth", block: "center"});
    }

    switchDisplayMode(targetElement) {
        let currentMode = targetElement.getAttribute("data-mode");
        if (currentMode === "minimized") {
            targetElement.setAttribute("data-mode", "fullscreen");
            this.element.classList.remove("minimized");
            this.element.classList.add("fullscreen");
            let controls = this.element.querySelector(".controls-mask");
            let timer = new executorTimer(() => {
                controls.style.display = "none";
                this.element.style.cursor = "none";
            }, 3000);
            timer.start();
            let boundHideControlsFullscreen = this.hideControlsFullscreen.bind(this, controls, timer);
            this.element.addEventListener("mousemove", boundHideControlsFullscreen);
            this.boundRemoveListeners = this.removeListeners.bind(this, timer, boundHideControlsFullscreen);
            targetElement.addEventListener("click", this.boundRemoveListeners);

        } else {
            targetElement.setAttribute("data-mode", "minimized");
            this.element.classList.add("minimized");
            this.element.classList.remove("fullscreen");
            targetElement.removeEventListener("click", this.boundRemoveListeners);
        }
    }

    hideControlsFullscreen(controls, timer, event) {
        this.element.style.cursor = "default";
        controls.style.display = "flex";
        timer.reset();
    }

    removeListeners(timer, boundHideControlsFullscreen, event) {
        timer.stop();
        this.element.removeEventListener("mousemove", boundHideControlsFullscreen);
    }
}
