import {videoUtils} from "../../../../imports.js";

const documentModule = require("assistos").loadModule("document", {});
const spaceModule = require("assistos").loadModule("space", {});
export class EffectItem{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.paragraphPresenter = this.element.closest("paragraph-item").webSkelPresenter;
        this.videoPresenter = this.paragraphPresenter.videoPresenter;
        this.commandsEditor = this.paragraphPresenter.commandsEditor;
        this._document = this.paragraphPresenter._document;
        this.audioMenuPresenter = this.element.closest("audio-menu").webSkelPresenter;
        this.paragraphId = this.paragraphPresenter.paragraph.id;
        let id = this.element.getAttribute("data-id");
        this.effect = this.paragraphPresenter.paragraph.commands.effects.find(effect => effect.id === id);
        this.invalidate();
    }
    beforeRender() {
        this.effectName = this.effect.name;
        this.effectPlayAt = videoUtils.formatTime(this.effect.playAt);
    }
    afterRender() {
        this.audioElement = this.element.querySelector("audio");
        this.audioElement.volume = this.effect.volume;
    }
    async editEffect(button){
        let paragraphVideoDuration = this.videoPresenter.getVideoPreviewDuration(this.paragraphPresenter.paragraph);
        let audioSrc = await spaceModule.getAudioURL(this.effect.id);
        let editMenu = `
            <div class="effect-edit-menu">
                <form class="effect-parameters">
                    <div class="form-item margin-right">
                        <label class="form-label" for="name">Name</label>
                        <input class="form-input" type="text" id="name" name="name" value="${this.effect.name}" required data-condition="checkName">
                    </div>
                    <div class="form-row">
                        <div class="form-item margin-right">
                            <label class="form-label" for="start">Start</label>
                            <input class="form-input" type="number" id="start" name="start" value="${this.effect.start}" min="0" max="${this.effect.duration}" step="0.1">
                        </div>
                        <div class="form-item margin-right">
                            <label class="form-label" for="end">End</label>
                            <input class="form-input" type="number" id="end" name="end" value="${this.effect.end}" min="0" max="${this.effect.duration}" step="0.1">
                        </div>
                        <div class="form-item margin-right">
                            <label class="form-label" for="volume">Volume</label>
                            <input class="form-input" type="number" id="volume" name="volume" value="${this.effect.volume}" min="0" max="1" step="0.1">
                        </div>
                        <div class="form-item">
                            <label class="form-label" for="playAt">Play at</label>
                            <input class="form-input" type="number" id="playAt" name="playAt" value="${this.effect.playAt}" min="0" max="${paragraphVideoDuration}" step="0.1">
                        </div>
                    </div>
                </form>
                <div class="flex">
                    <div class="effect-audio-source">
                        <div class="form-label">Effect source</div>
                        <audio class="effect-source margin-right" controls src="${audioSrc}"></audio>  
                    </div>
                    <button class="general-button margin-right top-margin" data-local-action="saveEffect">Save</button>
                    <button class="general-button maintain-focus top-margin" data-local-action="closeEditMenu">Cancel</button>
                </div>
            </div>`;
        this.element.insertAdjacentHTML('beforeend', editMenu);
    }
    closeEditMenu(button){
        setTimeout(() => {
            button.closest(".effect-edit-menu").remove();
        }, 0);
    }
    checkName(element, formData){
        let string = formData.data.name.trim();
        return !/\s/.test(string);
    }
    async saveEffect(button){
        let menu = button.closest(".effect-edit-menu");
        const conditions = {
            "checkName": {fn: this.checkName, errorMessage: "Name cannot contain spaces"}
        }
        let formData = await assistOS.UI.extractFormInformation(menu.querySelector("form"), conditions);
        if (!formData.isValid) {
            return;
        }
        this.effect.name = formData.data.name.trim();
        this.effect.start = parseFloat(formData.data.start);
        this.effect.end = parseFloat(formData.data.end);
        this.effect.volume = parseFloat(formData.data.volume);
        this.effect.playAt = parseFloat(formData.data.playAt);
        await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraphId, this.paragraphPresenter.paragraph.commands);
        menu.remove();
        this.invalidate();
    }
    async deleteEffect(button){
        await this.commandsEditor.deleteCommand("effects", this.effect.id);
        this.audioMenuPresenter.invalidate();
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