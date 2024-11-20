const llmModule = require("assistos").loadModule("llm", {});
const personalityModule = require("assistos").loadModule("personality", {});
const spaceModule = require("assistos").loadModule("space", {});
const documentModule = require("assistos").loadModule("document", {});

export class AudioMenu {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this._document = document.querySelector("document-view-page").webSkelPresenter._document;
        this.paragraphPresenter = this.element.closest("paragraph-item").webSkelPresenter;
        this.commandsEditor = this.paragraphPresenter.commandsEditor;
        this.paragraphId = this.paragraphPresenter.paragraph.id;
        this.invalidate(async () => {
            this.personalities = await personalityModule.getPersonalities(assistOS.space.id);
            this.emotions = await llmModule.listEmotions(assistOS.space.id);
        });
        this.element.setAttribute("data-local-action", "editItem textToSpeech");
        this.element.setAttribute("id", "current-selection");
        this.menuIcon = `<img class="pointer" loading="lazy" src="./wallet/assets/icons/audio.svg" alt="icon">`;
    }

    beforeRender() {
        let personalitiesHTML = "";
        let configuredPersonalitiesFound = 0;
        for (let personality of this.personalities) {
            if (personality.voiceId) {
                personalitiesHTML += `<option value="${personality.id}">${personality.name}</option>`;
                configuredPersonalitiesFound++;
            }
        }
        this.currentEffects = "";
        if(this.paragraphPresenter.paragraph.commands.effects){
            for(let effect of this.paragraphPresenter.paragraph.commands.effects){
                this.currentEffects += `
                            <effect-item class="pointer" data-presenter="effect-item" data-id="${effect.id}"></effect-item>`;
            }
        }

        if (configuredPersonalitiesFound === 0) {
            personalitiesHTML += `<option value="default" disabled>No personalities with voice</option>`;
        } else if (configuredPersonalitiesFound <= this.personalities.length) {
            personalitiesHTML += `<option value="default" disabled>${this.personalities.length - configuredPersonalitiesFound} personalities unconfigured</option>`;
        }

        this.personalitiesHTML = personalitiesHTML;
        let emotionsHTML = "";
        for (let emotion of this.emotions) {
            emotionsHTML += `<option value="${emotion}">${emotion}</option>`;
        }
        this.emotionsHTML = emotionsHTML;
        this.speechCommand = this.paragraphPresenter.paragraph.commands["speech"];

        if (this.speechCommand && this.speechCommand.personality) {
            const selectedPersonality = this.personalities.find(personality => personality.name === this.speechCommand.personality);
            if (selectedPersonality) {
                this.speechCommand.personality = selectedPersonality.id;
            }
        }
        this.paragraphText = this.paragraphPresenter.paragraph.text;
    }


    async afterRender() {
        if (this.speechCommand && this.speechCommand.personality) {
            let personalityOption = this.element.querySelector(`option[value="${this.speechCommand.personality}"]`);
            personalityOption.selected = true;
            if(this.speechCommand.emotion){
                let emotionOption = this.element.querySelector(`option[value="${this.speechCommand.emotion}"]`);
                emotionOption.selected = true;
            }
            let styleGuidance = this.element.querySelector(`#styleGuidance`);
            styleGuidance.value = this.speechCommand.styleGuidance || 15;
        }
        if(this.paragraphPresenter.paragraph.commands.audio){
            let audioElement = this.element.querySelector(".paragraph-audio");
            audioElement.classList.remove("hidden");
            this.element.querySelector(".delete-audio").classList.remove("hidden");
            this.element.querySelector(".volume-item").classList.remove("hidden");
            let volumeInput = this.element.querySelector("#volume");
            volumeInput.value = this.paragraphPresenter.paragraph.commands.audio.volume;
            let saveVolumeButton = this.element.querySelector(".save-volume");
            volumeInput.addEventListener("input", async () => {
                let volume = parseFloat(volumeInput.value);
                audioElement.volume = volume;
                if(volume !== this.paragraphPresenter.paragraph.commands.audio.volume){
                    saveVolumeButton.classList.remove("hidden");
                } else {
                    saveVolumeButton.classList.add("hidden");
                }
            });
            audioElement.src = await spaceModule.getAudioURL(this.paragraphPresenter.paragraph.commands.audio.id);
        }
        if(this.paragraphPresenter.paragraph.commands.speech){
            let deleteSpeechButton = this.element.querySelector(".delete-speech");
            deleteSpeechButton.classList.remove("hidden");
        }
        if(this.paragraphPresenter.paragraph.commands.silence){
            let deleteSilenceButton = this.element.querySelector(".delete-silence");
            deleteSilenceButton.classList.remove("hidden");
            let currentSilenceElement = this.element.querySelector(".current-silence-time");
            currentSilenceElement.classList.remove("hidden");
            let silenceTime = this.element.querySelector(".silence-time");
            silenceTime.innerHTML = this.paragraphPresenter.paragraph.commands.silence.duration;
        }
        if(this.paragraphPresenter.paragraph.text.trim() === ""){
            let warnMessage = `No text to convert to speech`;
            this.showSpeechWarning(warnMessage);
        }
    }
    async saveVolume(button){
        let volumeInput = this.element.querySelector("#volume");
        this.paragraphPresenter.paragraph.commands.audio.volume = parseFloat(volumeInput.value);
        await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraphId, this.paragraphPresenter.paragraph.commands);
        button.classList.add("hidden");
    }
    showSpeechWarning(message){
        let warning = `
                <div class="paragraph-warning">
                    <img loading="lazy" src="./wallet/assets/icons/warning.svg" class="video-warning-icon" alt="warn">
                    <div class="warning-text">${message}</div>
                </div>`;
        let ttsSection = this.element.querySelector(".tts-section");
        ttsSection.insertAdjacentHTML("afterend", warning);
    }
    async textToSpeech(_target) {
        const formData = await assistOS.UI.extractFormInformation(_target);
        if (!formData.isValid) {
            return;
        }
        let personalityName = this.personalities.find(personality => personality.id === formData.data.personality).name;
        const commandConfig = {
            personality: personalityName,
            emotion: formData.data.emotion,
            styleGuidance: formData.data.styleGuidance
        }
        await this.commandsEditor.insertCommandWithTask("speech", commandConfig);
        this.invalidate();
    }
    async insertAudio(){
        await this.commandsEditor.insertAttachmentCommand("audio");
        this.invalidate();
    }
    async deleteAudio(){
        await this.commandsEditor.deleteCommand("audio");
        this.invalidate();
    }
    async deleteSpeech(){
        await this.commandsEditor.deleteCommand("speech");
        this.invalidate();
    }
    async deleteSilence(){
        await this.commandsEditor.deleteCommand("silence");
        this.invalidate();
    }
    async insertSoundEffect(){
        await this.commandsEditor.insertAttachmentCommand("effects");
        this.invalidate();
    }

    showSilencePopup(targetElement, mode) {
        if (mode === "off") {
            let popup = `<silence-popup data-presenter="silence-popup" data-paragraph-id="${this.paragraphPresenter.paragraph.id}"></silence-popup>`;
            this.element.insertAdjacentHTML('beforeend', popup);
            let controller = new AbortController();
            document.addEventListener("click", this.hidePopupSilencePopup.bind(this, controller, targetElement), {signal: controller.signal});
            targetElement.setAttribute("data-local-action", "showSilencePopup on");
        }
    }

    hidePopupSilencePopup(controller, targetElement, event) {
        if (event.target.closest("silence-popup") || event.target.tagName === "A") {
            return;
        }
        targetElement.setAttribute("data-local-action", "showSilencePopup off");
        let popup = this.paragraphPresenter.element.querySelector("silence-popup");
        if (popup) {
            popup.remove();
        }
        controller.abort();
    }
}
