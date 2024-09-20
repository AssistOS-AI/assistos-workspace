import {executorTimer} from "../../../../imports.js";
const documentModule = require("assistos").loadModule("document", {});
const utilModule = require("assistos").loadModule("util", {});
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
        this.videoPlayer = this.element.querySelector(".video-player");

        if(!this.boundPlayNextVideo){
            this.boundPlayNextVideo = this.incrementParagraphIndexAndPlayVideo.bind(this);
            this.videoPlayer.addEventListener("ended", this.boundPlayNextVideo);
        }
        if(!this.boundIncrementTimestampVideo){
            this.boundIncrementTimestampVideo = this.incrementTimestampVideo.bind(this);
            this.videoPlayer.addEventListener("timeupdate", this.boundIncrementTimestampVideo);
        }
        if(!this.boundCheckVideoLoaded){
            this.boundCheckVideoLoaded = this.checkVideoLoaded.bind(this);
            this.videoPlayer.addEventListener("loadedmetadata", this.boundCheckVideoLoaded);
        }

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
        if (!this.boundIncrementTimestampAudio) {
            this.boundIncrementTimestampAudio = this.incrementTimestampAudio.bind(this);
            this.audioPlayer.addEventListener("timeupdate", this.boundIncrementTimestampAudio);
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

    incrementTimestampAudio() {
        this.currentTimeElement.innerHTML = this.formatTime(this.currentTime + this.audioPlayer.currentTime);
    }
    incrementTimestampVideo() {
        this.currentTimeElement.innerHTML = this.formatTime(this.currentTime + this.videoPlayer.currentTime);
    }

    afterUnload() {
        this.audioPlayer.pause();
        this.audioPlayer.removeEventListener("ended", this.boundPlayNext);
        this.audioPlayer.removeEventListener("canplay", this.boundCheckAudioLoaded);
        this.imageTag.removeEventListener("load", this.boundCheckImageLoaded);
    }
    checkVideoLoaded() {
        this.nextButton.classList.remove("disabled");
        let playPause = this.element.querySelector(".play-pause");
        playPause.setAttribute("data-local-action", "playPause");
        let mode = playPause.getAttribute("data-mode");

        if (!this.isPaused && mode !== "playFromBeginning") {
            this.videoPlayer.play();
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
            this.nextButton.classList.remove("disabled");

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
            this.nextButton.classList.add("disabled");
            this.imageLoaded = false;
            this.imageTag.src = src;
        } else if(type === "audio") {
            this.nextButton.classList.add("disabled");
            this.audioLoaded = false;
            this.currentTime += this.audioPlayer.currentTime;
            this.audioPlayer.src = src;
            this.audioPlayer.load();
        } else {
            this.nextButton.classList.add("disabled");
            this.videoPlayer.src = src;
            this.videoPlayer.load();
            this.videoPlayer.classList.remove("hidden");
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
                this.paragraphIndex = 0;
                this.chapterIndex = 0;
                return;
            }
            this.paragraphIndex = this.document.chapters[this.chapterIndex].paragraphs.length - 1;
        }

    }

    incrementParagraphIndex() {
        if(!this.document.chapters[this.chapterIndex]){
            //end of document
            return;
        }
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
        this.audioPlayer.src = "";
        this.playNext();
    }
    incrementParagraphIndexAndPlayVideo() {
        this.currentTime += this.videoPlayer.duration;
        this.incrementParagraphIndex();
        this.videoPlayer.src = "";
        this.videoPlayer.classList.add("hidden");
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
        this.videoPlayer.pause();
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
                this.remainingSilentDuration = Math.ceil((totalSilentDuration - elapsedTime) / 1000) * 1000;
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
        if(this.videoPlayer.classList.contains("hidden")){
            this.audioPlayer.play();
        } else {
            this.videoPlayer.play();
        }

        if (this.remainingSilentDuration > 0) {
            // Resume the silence with the remaining duration
            this.silenceStartTime = Date.now();
            this.incrementTimeInterval = setInterval(this.boundIncrementTimestamp, 1000);
            this.silenceTimeout = setTimeout(async () => {
                clearInterval(this.incrementTimeInterval);
                delete this.incrementTimeInterval;
                delete this.silenceTimeout;
                this.incrementParagraphIndex();
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
                if(paragraph.commands.video){
                    let videoSrc = utilModule.constants.getVideoSrc(assistOS.space.id, paragraph.commands.video.id);
                    this.setCurrentParagraphAndChapter(i, j);
                    this.scrollDocument();
                    this.loadResource("video", videoSrc);
                    return
                } else if (paragraph.commands.audio) {
                    let imageSrc= "./wallet/assets/images/black-screen.png"
                    if(paragraph.commands.image){
                        imageSrc = utilModule.constants.getImageSrc(assistOS.space.id, paragraph.commands.image.id);
                    }

                    this.setCurrentParagraphAndChapter(i, j);
                    this.loadResource("image", imageSrc);
                    let audioSrc = utilModule.constants.getAudioSrc(assistOS.space.id, paragraph.commands.audio.id);
                    this.loadResource("audio", audioSrc);
                    this.scrollDocument();
                    return;
                } else if (paragraph.commands["silence"]){
                    if(paragraph.commands.image){
                        let imageSrc = utilModule.constants.getImageSrc(assistOS.space.id, paragraph.commands.image.id);
                        this.loadResource("image", imageSrc);
                    } else {
                        this.loadResource("image", "./wallet/assets/images/black-screen.png");
                    }
                    this.setCurrentParagraphAndChapter(i, j);
                    let duration = paragraph.commands["silence"].paramsObject.duration;
                    this.executeSilenceCommand(duration);
                    return;
                } else if(paragraph.commands.image){
                    this.setCurrentParagraphAndChapter(i, j);
                    let imageSrc = utilModule.constants.getImageSrc(assistOS.space.id, paragraph.commands.image.id);
                    this.loadResource("image", imageSrc);
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
            await this.playNext();
        }, this.silenceDuration);
    }

    incrementTimestamp() {
        this.currentTime += 1;
        this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
    }

    skipToNextScene(targetElement) {
        this.nextButton.classList.add("disabled");
        //skip is called at the beginning of the document
        if(this.chapterIndex === 0 && this.paragraphIndex === 0){
            this.previousButton.classList.remove("disabled");
        }
        this.cancelTimeouts();
        let playPause = this.element.querySelector(".play-pause");
        let currentMode = playPause.getAttribute("data-mode");
        let paragraph = this.document.chapters[this.chapterIndex].paragraphs[this.paragraphIndex];

        this.audioPlayer.pause();

        //clean up before moving on to the next scene
        if(paragraph.commands.video){
            this.currentTime += this.videoPlayer.duration;
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            this.videoPlayer.src = "";
            this.videoPlayer.classList.add("hidden");
        } else if (paragraph.commands.audio) {
            this.currentTime = this.currentTime + this.audioPlayer.duration;
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            this.audioPlayer.src = "";
        } else if (paragraph.commands["silence"]) {
            this.currentTime += parseFloat(paragraph.commands["silence"].paramsObject.duration);
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
        } else if(paragraph.commands.image){
            this.currentTime += 1;
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
        }

        this.incrementParagraphIndex();
        if (this.chapterIndex === this.document.chapters.length) {
            //reached end of document
            this.prepareVideoForReload();
            return;
        }

        let nextParagraph = this.document.chapters[this.chapterIndex].paragraphs[this.paragraphIndex];
        if(!nextParagraph.commands.video && !nextParagraph.commands.audio && !nextParagraph.commands["silence"] && !nextParagraph.commands.image){
            return this.skipToNextScene();
        }
        this.setCurrentParagraphAndChapter(this.chapterIndex, this.paragraphIndex);
        if(nextParagraph.commands.video){
            this.videoPlayer.addEventListener("loadedmetadata", this.waitResourceLoad.bind(this), {once: true});
            if(currentMode === "play") {
                this.playNext();
                return;
            }
            let videoSrc = utilModule.constants.getVideoSrc(assistOS.space.id, nextParagraph.commands.video.id);
            this.loadResource("video", videoSrc);
            this.scrollDocument();
            this.nextButton.classList.remove("disabled");
            return;
        } else if(nextParagraph.commands.audio){
            this.audioPlayer.addEventListener("loadedmetadata", this.waitResourceLoad.bind(this), {once: true});
            if(currentMode === "play") {
                this.playNext();
                return;
            }
            let audioSrc = utilModule.constants.getAudioSrc(assistOS.space.id, nextParagraph.commands.audio.id);
            this.loadResource("audio", audioSrc);
        } else if(nextParagraph.commands["silence"]){
            this.remainingSilentDuration = parseFloat(nextParagraph.commands["silence"].paramsObject.duration) * 1000;
            this.silenceDuration = this.remainingSilentDuration;
        }
        if(currentMode === "play") {
            this.nextButton.classList.remove("disabled");
            this.playNext();
            return;
        }
        if(nextParagraph.commands.image){
            let imageSrc = utilModule.constants.getImageSrc(assistOS.space.id, nextParagraph.commands.image.id);
            this.loadResource("image", imageSrc);
        } else {
            this.loadResource("image", "./wallet/assets/images/black-screen.png");
        }
        this.scrollDocument();
        this.nextButton.classList.remove("disabled");
    }
    waitResourceLoad(event) {
        this.nextButton.classList.remove("disabled");
    }
    skipTimeStampStartVideo(){
        this.currentTime = this.currentTime - this.videoPlayer.duration;
        this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
        this.nextButton.classList.remove("disabled");
    }
    skipTimeStampStartAudio(event) {
        this.currentTime = this.currentTime - this.audioPlayer.duration;
        this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
        this.nextButton.classList.remove("disabled");
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
            clearTimeout(this.silenceTimeout);
            delete this.silenceTimeout;
            this.remainingSilentDuration = 0;
        }

        //stop incrementing timestamp
        if (this.incrementTimeInterval) {
            clearInterval(this.incrementTimeInterval);
            delete this.incrementTimeInterval;
        }
    }

    async skipToPreviousScene(targetElement) {
        this.previousButton.classList.add("disabled");
        this.cancelTimeouts();
        let playPause = this.element.querySelector(".play-pause");
        let currentMode = playPause.getAttribute("data-mode");
        let paragraph;
        //skip previous is called at the end of the document
        if (currentMode === "reload") {
            playPause.setAttribute("data-mode", "pause");
            playPause.innerHTML = `<img class="pointer" src="./wallet/assets/icons/play.svg" alt="play">`;
            currentMode = "pause";
            this.isPaused = true;
            this.chapterIndex = this.document.chapters.length - 1;
            this.paragraphIndex = this.document.chapters[this.document.chapters.length - 1].paragraphs.length - 1;

            let lastChapter = this.document.chapters[this.chapterIndex];
            paragraph = lastChapter.paragraphs[this.paragraphIndex];
        } else {
            paragraph = this.document.chapters[this.chapterIndex].paragraphs[this.paragraphIndex];
        }


        if (currentMode === "play"){
            this.playPause(playPause);
        }
        //clean up before moving on to the previous scene
        if(paragraph.commands.video){
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            this.videoPlayer.src = "";
        }else if (paragraph.commands.audio) {
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            this.audioPlayer.src = "";
        } else if (paragraph.commands["silence"]) {
            const elapsedTime = Math.floor((this.silenceDuration - this.remainingSilentDuration) / 1000);
            this.currentTime -= elapsedTime;
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
        } else if(paragraph.commands.image){
            this.currentTime -= 1;
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
        }
        this.decrementParagraphIndex();
        let previousParagraph = this.document.chapters[this.chapterIndex].paragraphs[this.paragraphIndex];
        if (this.chapterIndex === 0 && this.paragraphIndex === 0) {
            //reached start of document
            this.loadResource("image", "./wallet/assets/images/black-screen.png");
            this.setCurrentParagraphAndChapter(0, 0);
            this.audioPlayer.currentTime = 0;
            this.audioPlayer.src = "";
            this.previousButton.classList.add("disabled");
            if(previousParagraph.commands.video){
                let videoSrc = utilModule.constants.getVideoSrc(assistOS.space.id, previousParagraph.commands.video.id);
                this.loadResource("video", videoSrc);
                this.videoPlayer.classList.remove("hidden");
            } else if(previousParagraph.commands.audio){
                let audioSrc = utilModule.constants.getAudioSrc(assistOS.space.id, previousParagraph.commands.audio.id);
                this.loadResource("audio", audioSrc);
            }
            this.resetTimestamp();
            //pause the video at the beginning
            playPause.setAttribute("data-mode", "play");
            await this.playPause(playPause);
            playPause.setAttribute("data-mode", "playFromBeginning");
            this.isPaused = false;
            return;
        }
        //empty paragraph
        if(!previousParagraph.commands.video && !previousParagraph.commands.audio && !previousParagraph.commands["silence"] && !previousParagraph.commands.image){
            return this.skipToPreviousScene();
        }
        this.setCurrentParagraphAndChapter(this.chapterIndex, this.paragraphIndex);
        //load previous scene from beginning
        if(previousParagraph.commands.video){
            this.videoPlayer.addEventListener("loadedmetadata", this.skipTimeStampStartVideo.bind(this), {once: true});
            let videoSrc = utilModule.constants.getVideoSrc(assistOS.space.id, previousParagraph.commands.video.id);
            this.loadResource("video", videoSrc);
        } else if (previousParagraph.commands.audio) {
            this.audioPlayer.addEventListener("loadedmetadata", this.skipTimeStampStartAudio.bind(this), {once: true});
            let audioSrc = utilModule.constants.getAudioSrc(assistOS.space.id, previousParagraph.commands.audio.id);
            this.loadResource("audio", audioSrc);
            if(previousParagraph.commands.image){
                let imageSrc = utilModule.constants.getImageSrc(assistOS.space.id, previousParagraph.commands.image.id);
                this.loadResource("image", imageSrc);
            } else {
                this.loadResource("image", "./wallet/assets/images/black-screen.png");
            }
        } else if (previousParagraph.commands["silence"]) {
            this.currentTime -= parseFloat(previousParagraph.commands["silence"].paramsObject.duration);
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            //to be able to resume the video with the remaining silent duration
            this.remainingSilentDuration = previousParagraph.commands["silence"].paramsObject.duration * 1000;
            this.silenceDuration = this.remainingSilentDuration;
            this.resumeCallback = () => {
                this.isPaused = false;
                this.playNext();
            };

            if(previousParagraph.commands.image){
                let imageSrc = utilModule.constants.getImageSrc(assistOS.space.id, previousParagraph.commands.image.id);
                this.loadResource("image", imageSrc);
            } else {
                this.loadResource("image", "./wallet/assets/images/black-screen.png");
            }
        } else if(previousParagraph.commands.image){
            this.currentTime -= 1;
            this.currentTimeElement.innerHTML = this.formatTime(this.currentTime);
            let imageSrc = utilModule.constants.getImageSrc(assistOS.space.id, previousParagraph.commands.image.id);
            this.loadResource("image", imageSrc);
        }

        this.scrollDocument();
        this.previousButton.classList.remove("disabled");
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
