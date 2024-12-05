import {videoUtils} from "../../../../imports.js";
const documentModule = require("assistos").loadModule("document", {});
const spaceModule = require("assistos").loadModule("space", {});
export class EffectItem{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.audioMenuPresenter = this.element.closest("audio-menu").webSkelPresenter;
        this.paragraphId = this.audioMenuPresenter.paragraphId;
        let id = this.element.getAttribute("data-id");
        this.effect = this.audioMenuPresenter.commands.effects.find(effect => effect.id === id);
        this.invalidate();
    }
    beforeRender() {
        this.effectName = this.effect.name;
        this.effectPlayAt = videoUtils.formatTime(this.effect.playAt);
        this.effectId = this.effect.id;
    }
    afterRender() {
        this.audioElement = this.element.querySelector("audio");
        this.audioElement.volume = this.effect.volume / 100;
    }
    async editEffect(button){
        let paragraphVideoDuration = videoUtils.getParagraphVideoDuration(this.audioMenuPresenter.commands);
        let refreshComponent = await assistOS.UI.showModal("edit-effect-modal", {
            id: this.effect.id,
            duration: paragraphVideoDuration
        }, true);
        if(refreshComponent){
            this.invalidate();
        }
    }

    async playEffect(button){
        button.src = "./wallet/assets/icons/pause.svg";
        button.setAttribute("data-local-action", `pauseEffect`);
        if(!this.audioElement.hasHandlers){
            this.audioElement.hasHandlers = true;
            this.audioElement.addEventListener("play", this.handlePlay);
            this.audioElement.addEventListener("timeupdate", this.handleEnd.bind(this.audioElement, button));
        }
        this.audioElement.src = await spaceModule.getAudioURL(this.effect.id);
        this.audioElement.startTime = this.effect.start;
        this.audioElement.endTime = this.effect.end;
        await this.audioElement.play();
    }
    pauseEffect(button){
        this.audioElement.pause();
        button.src = "./wallet/assets/icons/play.svg";
        button.setAttribute("data-local-action", `playEffect`);
    }
    handlePlay(event){
        let start = this.startTime;
        if (this.currentTime < start) {
            this.currentTime = start;
        }
    }
    handleEnd(button, event){
        if (this.currentTime >= this.endTime) {
            button.src = "./wallet/assets/icons/play.svg";
            this.pause();
        }
    }
}