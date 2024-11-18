import {CustomAudio, videoUtils} from "../../imports.js";
const spaceModule = require("assistos").loadModule("space", {});
async function playEffects(effectsCopy, mediaPlayer, self) {
    if(effectsCopy.length === 0){
        return;
    }
    const currentEffect = effectsCopy[0];
    const { playAt, audioInstance, id, volume, start, end } = currentEffect;

    // Check if we need to initialize the audio instance
    if (!audioInstance && mediaPlayer.currentTime >= (playAt - 2)) {
        currentEffect.audioInstance = new CustomAudio(start, end);
        currentEffect.audioInstance.audio.volume = volume;
        currentEffect.audioInstance.audio.isSetUp = false; // Ensure setup state is tracked

        currentEffect.audioInstance.audio.addEventListener("canplaythrough", async () => {
            if (currentEffect.audioInstance.audio.playWhenReady) {
                self.hideLoader();
                await self.resumeVideo();
                await currentEffect.audioInstance.audio.play();
            }
        }, { once: true });
        currentEffect.audioInstance.audio.src = await spaceModule.getAudioURL(id);
        currentEffect.audioInstance.audio.load();
    }

    // Check if the audio instance is ready to play
    if (audioInstance && !audioInstance.audio.isSetUp && mediaPlayer.currentTime >= playAt) {
        audioInstance.audio.isSetUp = true;
        audioInstance.audio.addEventListener("ended", () => {
            effectsCopy.shift();
        }, { once: true });

        // If the audio isn't fully buffered, pause and show loader
        if (audioInstance.audio.readyState < 4) {
            audioInstance.audio.playWhenReady = true;
            self.pauseVideoPreview();
            self.showLoader();
            return;
        }
        await audioInstance.audio.play();
    }
}

function setupEffects(mediaPlayer, effects, self){
    if(mediaPlayer.timeUpdateController){
        mediaPlayer.timeUpdateController.abort();
        mediaPlayer.pauseController.abort();
        mediaPlayer.playController.abort();
    }
    let effectsCopy = JSON.parse(JSON.stringify(effects));
    effectsCopy.sort((a, b) => a.playAt - b.playAt);
    let timeUpdateController = new AbortController();

    mediaPlayer.addEventListener("timeupdate", async () => {
        await videoUtils.playEffects(effectsCopy, mediaPlayer, self);
    }, {signal: timeUpdateController.signal});


    let pauseController = new AbortController();
    mediaPlayer.addEventListener("pause", () => {
        for(let effect of effectsCopy){
            if(effect.audioInstance){
                effect.audioInstance.audio.pause();
            }
        }
    }, {signal: pauseController.signal});
    let playController = new AbortController();
    mediaPlayer.addEventListener("play", () => {
        for(let effect of effectsCopy){
            if(effect.audioInstance && mediaPlayer.currentTime >= effect.playAt){
                effect.audioInstance.audio.play();
            }
        }
    }, {signal: pauseController.signal});
    mediaPlayer.addEventListener("ended", () => {
        timeUpdateController.abort();
        pauseController.abort();
        playController.abort();
    }, {once: true});
    mediaPlayer.timeUpdateController = timeUpdateController;
    mediaPlayer.pauseController = pauseController;
    mediaPlayer.playController = playController;

}
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let remainingSeconds = Math.floor(seconds % 60);
    remainingSeconds = String(remainingSeconds).padStart(2, '0');

    if (hours > 0) {
        return `${hours}:${minutes}:${remainingSeconds}`;
    }
    return `${minutes}:${remainingSeconds}`;
}
export default {
    playEffects,
    setupEffects,
    formatTime
}