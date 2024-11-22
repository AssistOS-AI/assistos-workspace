const spaceModule = require("assistos").loadModule("space", {});
export class EditEffectModal{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.audioMenuPresenter = document.querySelector("audio-menu").webSkelPresenter;
        let id = this.element.getAttribute("data-id");
        this.effect = this.audioMenuPresenter.commands.effects.find(effect => effect.id === id);
        this.videoDuration = this.element.getAttribute("data-duration");
        this.invalidate();
    }
    async beforeRender() {
        this.audioSrc = await spaceModule.getAudioURL(this.effect.id);
        this.effectName = this.effect.name;
        this.effectStart = this.effect.start;
        this.effectEnd = this.effect.end;
        this.effectVolume = this.effect.volume;
        this.effectPlayAt = this.effect.playAt;
    }
    afterRender() {

    }
    checkName(element, formData){
        let string = formData.data.name.trim();
        return !/\s/.test(string);
    }
    async saveEffect(button){
        const conditions = {
            "checkName": {fn: this.checkName, errorMessage: "Name cannot contain spaces"}
        }
        let formData = await assistOS.UI.extractFormInformation(this.element.querySelector("form"), conditions);
        if (!formData.isValid) {
            return;
        }
        this.effect.name = formData.data.name.trim();
        this.effect.start = parseFloat(formData.data.start);
        this.effect.end = parseFloat(formData.data.end);
        this.effect.volume = parseFloat(formData.data.volume);
        this.effect.playAt = parseFloat(formData.data.playAt);
        assistOS.UI.closeModal(this.element, true);
    }
    closeModal(button){
        assistOS.UI.closeModal(this.element);
    }
}