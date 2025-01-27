import {executorTimer} from "../../../../utils/utils.js";
import {videoUtils} from "../../../../imports.js";
const spaceModule = require("assistos").loadModule("space", {});
const blackScreen = "./wallet/assets/images/black-screen.png";
export class ParagraphVideoPreview{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let paragraphPresenter = this.element.closest("paragraph-item").webSkelPresenter;
        paragraphPresenter.videoPresenter = this;
        this.chapter = paragraphPresenter.chapter;
        this.paragraph = paragraphPresenter.paragraph;
        this.commandsEditor = paragraphPresenter.commandsEditor;
        this.commandsEditor.videoPresenter = this;
        this._document = paragraphPresenter._document;
        this.invalidate();
    }
    beforeRender() {

    }
    async afterRender() {
        this.initVideoElements();
        await this.setupVideoPreview();
    }
    refreshVideoPreview() {
        this.invalidate();
    }
    initVideoElements() {
        this.playPauseContainer = this.element.querySelector('.play-pause-container');
        this.playPauseIcon = this.element.querySelector(".play-pause");
        this.videoElement = this.element.querySelector(".video-player");
        this.imgElement = this.element.querySelector(".paragraph-image");
        this.audioElement = this.element.querySelector(".audio-player");
        this.currentTimeElement = this.element.querySelector(".current-time");
        this.chapterAudioElement = this.element.querySelector(".chapter-audio");
        if (!this.boundShowControls) {
            this.boundShowControls = this.showControls.bind(this);
            this.boundHideControls = this.hideControls.bind(this);
        }
        this.element.addEventListener("mouseover", this.boundShowControls);
        this.element.addEventListener("mouseout", this.boundHideControls);
    }
    showControls() {
        let controls = this.element.querySelector(".controls-mask-paragraph");
        controls.style.display = "flex";
    }

    hideControls() {
        let controls = this.element.querySelector(".controls-mask-paragraph");
        controls.style.display = "none";
    }
    switchDisplayMode(targetElement) {
        let currentMode = targetElement.getAttribute("data-mode");
        if (currentMode === "minimized") {
            targetElement.setAttribute("data-mode", "fullscreen");
            this.element.classList.add("fullscreen-paragraph-video");
            let controls = this.element.querySelector(".controls-mask-paragraph");
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
            this.element.classList.remove("fullscreen-paragraph-video");
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

    async playPause(targetElement) {
        let nextMode = targetElement.getAttribute("data-next-mode");
        if (nextMode === "play") {
            targetElement.setAttribute("data-next-mode", "pause");
            targetElement.src = "./wallet/assets/icons/pause.svg";
            await this.playVideoPreview();
        }
        if (nextMode === "resume") {
            targetElement.setAttribute("data-next-mode", "pause");
            targetElement.src = "./wallet/assets/icons/pause.svg";
            await this.resumeVideo();
        } else if (nextMode === "pause") {
            targetElement.setAttribute("data-next-mode", "resume");
            targetElement.src = "./wallet/assets/icons/play.svg";
            this.pauseVideoPreview();
        }
    }
    pauseVideoPreview(){
        this.audioElement.pause();
        this.videoElement.pause();
        this.chapterAudioElement.pause();
        if (this.silenceInterval) {
            clearInterval(this.silenceInterval);
            delete this.silenceInterval;
        }
    }

    async resumeVideo() {
        if (this.chapterAudioStartTime > -1) {
            this.chapterAudioElement.play();
        }
        if (this.paragraph.commands.video) {
            if (this.paragraph.commands.audio) {
                this.audioElement.play();
            }
            this.videoElement.play();
        } else if (this.paragraph.commands.audio) {
            this.audioElement.play();
        } else if (this.paragraph.commands.silence) {
            this.playSilence(this.paragraph.commands.silence.duration);
        } else if (this.paragraph.commands.image) {
            this.playSilence(1);
        }
    }

    setupMediaPlayerEventListeners(mediaPlayer) {
        if(this.paragraph.commands.effects){
            videoUtils.setupEffects(mediaPlayer, this.paragraph.commands.effects, this);
        }
        let stopTimeUpdateController = new AbortController();
        mediaPlayer.addEventListener("timeupdate", () => {
            this.currentTimeElement.innerHTML = videoUtils.formatTime(mediaPlayer.currentTime);
            if (mediaPlayer.endTime && mediaPlayer.currentTime >= mediaPlayer.endTime) {
                mediaPlayer.pause();
                mediaPlayer.currentTime = mediaPlayer.endTime;
                const endedEvent = new Event('ended');
                mediaPlayer.dispatchEvent(endedEvent);
            }
        }, {signal: stopTimeUpdateController.signal});

        mediaPlayer.addEventListener("ended", () => {
            this.chapterAudioElement.pause();
            setTimeout(async () => {
                stopTimeUpdateController.abort();
                this.playPauseIcon.setAttribute("data-next-mode", "play");
                this.playPauseIcon.src = "./wallet/assets/icons/play.svg";
                this.currentTimeElement.innerHTML = videoUtils.formatTime(0);
                this.videoElement.classList.add("hidden");
                await this.setVideoThumbnail();
                this.videoElement.currentTime = 0;
                this.audioElement.currentTime = 0;
            }, 1000);
        }, {once: true});
    }

    playMediaSynchronously(mediaPlayers) {
        let played = false;
        let readyCount = 0;
        const totalPlayers = mediaPlayers.length;
        if (totalPlayers === 0) {
            this.hideLoader();
            return;
        }
        for (let mediaPlayer of mediaPlayers) {
            mediaPlayer.addEventListener("canplaythrough", () => {
                readyCount++;
                if (readyCount === totalPlayers && !played) {
                    played = true;
                    this.hideLoader();
                    for (let mediaPlayer of mediaPlayers) {
                        if (mediaPlayer.startTime) {
                            mediaPlayer.currentTime = mediaPlayer.startTime;
                        }
                        mediaPlayer.play();
                    }
                }
            }, {once: true});
        }
    }

    async playMedia(mediaPlayers) {
        this.showLoader();
        if (this.chapterAudioStartTime > -1) {
            await this.setChapterAudioTime();
            mediaPlayers.push(this.chapterAudioElement);
            this.playMediaSynchronously(mediaPlayers);
        } else {
            this.playMediaSynchronously(mediaPlayers);
        }
        for (let mediaPlayer of mediaPlayers) {
            let id = mediaPlayer.getAttribute("data-id");
            if (id === "paragraph-video") {
                mediaPlayer.src = await spaceModule.getVideoURL(this.paragraph.commands.video.id);
            } else if (id === "paragraph-audio") {
                mediaPlayer.src = await spaceModule.getAudioURL(this.paragraph.commands.audio.id);
            } else if (id === "chapter-audio") {
                mediaPlayer.src = await spaceModule.getAudioURL(this.chapter.backgroundSound.id);
            }
            mediaPlayer.load();
        }
    }

    async setChapterAudioTime() {
        this.chapterAudioElement.addEventListener("loadedmetadata", () => {
            this.chapterAudioElement.currentTime = this.chapterAudioStartTime;
        });
        this.chapterAudioElement.src = await spaceModule.getAudioURL(this.chapter.backgroundSound.id);
        this.chapterAudioElement.pause();
        this.chapterAudioElement.volume = this.chapter.backgroundSound.volume / 100;
    }

    showLoader() {
        if (this.loaderTimeout) {
            return;
        }
        this.loaderTimeout = setTimeout(() => {
            this.playPauseIconSrc = this.playPauseIcon.src;
            this.playPauseNextMode = this.playPauseIcon.getAttribute("data-next-mode");
            this.playPauseContainer.innerHTML = `<div class="loading-icon"><div>`;
        }, 500);
    }

    hideLoader() {
        clearTimeout(this.loaderTimeout);
        delete this.loaderTimeout;
        if (this.playPauseNextMode) {
            this.playPauseContainer.innerHTML = `<img data-local-action="playPause" data-next-mode="${this.playPauseNextMode}" class="play-pause pointer" src="${this.playPauseIconSrc}" alt="playPause">`;
            this.playPauseIcon = this.element.querySelector(".play-pause");
            delete this.playPauseNextMode;
            delete this.playPauseIconSrc;
        }
    }

    getChapterAudioStartTime() {
        let totalDuration = 0;
        let paragraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
        for (let i = paragraphIndex - 1; i >= 0; i--) {
            let paragraph = this.chapter.paragraphs[i];
            let paragraphVideoDuration = videoUtils.getParagraphVideoDuration(paragraph.commands);
            totalDuration += paragraphVideoDuration;
        }
        let chapterAudioDuration = this.chapter.backgroundSound.duration;
        if (this.chapter.backgroundSound.loop) {
            return totalDuration % chapterAudioDuration;
        } else if (chapterAudioDuration >= totalDuration) {
            return totalDuration;
        } else {
            return -1;
        }
    }

    async playVideoPreview() {
        if (this.chapter.backgroundSound) {
            this.chapterAudioStartTime = this.getChapterAudioStartTime();
        }
        if (this.paragraph.commands.video) {
            this.videoElement.classList.remove("hidden");
            this.videoElement.startTime = this.paragraph.commands.video.start;
            this.videoElement.endTime = this.paragraph.commands.video.end;
            this.videoElement.volume = this.paragraph.commands.video.volume / 100;
            if (this.paragraph.commands.audio) {
                this.audioElement.volume = this.paragraph.commands.audio.volume / 100;
                let videoDuration = this.paragraph.commands.video.end - this.paragraph.commands.video.start;
                if (videoDuration >= this.paragraph.commands.audio.duration) {
                    this.setupMediaPlayerEventListeners(this.videoElement);
                } else {
                    this.setupMediaPlayerEventListeners(this.audioElement);
                }
                await this.playMedia([this.videoElement, this.audioElement]);
            } else {
                this.setupMediaPlayerEventListeners(this.videoElement);
                await this.playMedia([this.videoElement]);
            }
        } else if (this.paragraph.commands.audio) {
            this.audioElement.volume = this.paragraph.commands.audio.volume / 100;
            this.setupMediaPlayerEventListeners(this.audioElement);
            await this.playMedia([this.audioElement]);
        } else if (this.paragraph.commands.silence) {
            await this.playSilence(this.paragraph.commands.silence.duration);
        } else if (this.paragraph.commands.image) {
            //play chapter audio if it exists
            await this.playSilence(1);
        }
    }
    // async playSilenceV2(silenceDuration) {
    //     const audioPlayer = new Audio();
    //     audioPlayer.src = "./wallet/assets/audios/silence.mp3";
    //     audioPlayer.load();
    //     audioPlayer.loop = true;
    //     audioPlayer.volume = 0;
    //     audioPlayer.elapsedTime = 0;
    //     if (this.chapterAudioStartTime > -1) {
    //         await this.setChapterAudioTime();
    //     }
    //     audioPlayer.addEventListener("timeupdate", () => {
    //         if (audioPlayer.elapsedTime >= silenceDuration) {
    //             audioPlayer.pause();
    //         }
    //     });
    //     audioPlayer.addEventListener("ended", () => {
    //         audioPlayer.elapsedTime += 1;
    //     });
    //     this.setupMediaPlayerEventListeners(audioPlayer);
    //     await this.playMedia([audioPlayer]);
    // }
    async playSilence(silenceDuration) {
        if (!this.silenceElapsedTime) {
            this.silenceElapsedTime = 0;
            if (this.chapterAudioStartTime > -1) {
                await this.setChapterAudioTime();
            }
        }
        await this.playMedia([]);
        this.chapterAudioElement.play();
        this.silenceInterval = setInterval(() => {
            this.silenceElapsedTime += 1;
            this.currentTimeElement.innerHTML = videoUtils.formatTime(this.silenceElapsedTime);
            if (this.silenceElapsedTime === silenceDuration) {
                this.chapterAudioElement.pause();
                setTimeout(() => {
                    clearInterval(this.silenceInterval);
                    delete this.silenceInterval;
                    delete this.silenceElapsedTime;
                    this.playPauseIcon.setAttribute("data-next-mode", "play");
                    this.playPauseIcon.src = "./wallet/assets/icons/play.svg";
                    this.currentTimeElement.innerHTML = videoUtils.formatTime(0);
                }, 1000);
            }
        }, 1000);
    }



    async setupVideoPreview() {
        let hasAttachment = this.paragraph.commands.image || this.paragraph.commands.video ||
            this.paragraph.commands.audio || this.paragraph.commands.silence;
        this.currentTime = 0;
        if (hasAttachment) {
            this.element.style.display = "flex";
            let chapterNumber = this.element.querySelector(".chapter-number");
            let chapterIndex = this._document.getChapterIndex(this.chapter.id);
            chapterNumber.innerHTML = chapterIndex + 1;
            let paragraphNumber = this.element.querySelector(".paragraph-number");
            let paragraphIndex = this.chapter.getParagraphIndex(this.paragraph.id);
            paragraphNumber.innerHTML = paragraphIndex + 1;
            this.setVideoPreviewDuration();
        } else {
            this.element.style.display = "none";
        }
        this.videoElement.classList.add("hidden");
        await this.setVideoThumbnail();
    }

    setVideoPreviewDuration() {
        let videoDurationElement = this.element.querySelector(".video-duration");
        let duration = videoUtils.getParagraphVideoDuration(this.paragraph.commands);
        videoDurationElement.innerHTML = videoUtils.formatTime(duration);
    }

    async setVideoThumbnail() {
        let imageSrc = blackScreen;
        if (this.paragraph.commands.video) {
            if (this.paragraph.commands.video.thumbnailId) {
                imageSrc = await spaceModule.getImageURL(this.paragraph.commands.video.thumbnailId);
            }
        }
        if (this.paragraph.commands.image && !this.paragraph.commands.video) {
            imageSrc = await spaceModule.getImageURL(this.paragraph.commands.image.id);
        }
        this.imgElement.src = imageSrc;
    }

}