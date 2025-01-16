const llmModule = require("assistos").loadModule("llm", {});
const personalityModule = require("assistos").loadModule("personality", {});
const spaceModule = require("assistos").loadModule("space", {});
const documentModule = require("assistos").loadModule("document", {});

export class AudioMenu {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this._document = documentPresenter._document;
        let chapterId = this.element.getAttribute("data-chapter-id");
        let chapter = this._document.chapters.find(chapter => chapter.id === chapterId);
        this.paragraphId = this.element.getAttribute("data-paragraph-id");
        let paragraphPresenter = documentPresenter.element.querySelector(`paragraph-item[data-paragraph-id="${this.paragraphId}"]`).webSkelPresenter;
        this.commandsEditor = paragraphPresenter.commandsEditor;
        this.paragraph = chapter.paragraphs.find(paragraph => paragraph.id === this.paragraphId);
        this.commands = this.paragraph.commands;
        this.invalidate(async () => {
            this.personalities = await personalityModule.getPersonalities(assistOS.space.id);

        });
        this.element.classList.add("maintain-focus");
    }

    async beforeRender() {
        this.currentEffects = "";
        this.emotionsSelect = "";
        this.styleGuidanceSlide = "";
        if(this.commands.effects){
            for(let effect of this.commands.effects){
                this.currentEffects += `<effect-item class="pointer" data-presenter="effect-item" data-id="${effect.id}"></effect-item>`;
            }
        }
        let personalitiesHTML = "";
        let configuredPersonalitiesFound = 0;
        for (let personality of this.personalities) {
            if (personality.voiceId) {
                personalitiesHTML += `<option value="${personality.id}">${personality.name}</option>`;
                configuredPersonalitiesFound++;
            }
        }
        if (configuredPersonalitiesFound === 0) {
            personalitiesHTML += `<option value="default" disabled>No personalities with voice</option>`;
        } else if (configuredPersonalitiesFound <= this.personalities.length) {
            personalitiesHTML += `<option value="default" disabled>${this.personalities.length - configuredPersonalitiesFound} personalities unconfigured</option>`;
        }
        this.personalitiesHTML = personalitiesHTML;
        if (this.commands.speech && this.commands.speech.personality) {
            let emotionsHTML = await this.getEmotionsHTML(this.commands.speech.personality);
            if(emotionsHTML){
                this.emotionsSelect = emotionsHTML;
                this.styleGuidanceSlide = this.getStyleGuidanceHMTL();
            }
        }
    }
    async getEmotionsHTML(personalityName){
        let personality = this.personalities.find(personality => personality.name === personalityName);
        let emotions = await llmModule.listEmotions(assistOS.space.id, personality.llms["audio"]);
        if(emotions.length > 0){
            let emotionsHTML = "";
            for (let emotion of emotions) {
                emotionsHTML += `<option value="${emotion}">${emotion}</option>`;
            }
            return `<div class="form-item" id="emotionsSelect">
                    <label for="emotion" class="form-label">Select Emotion</label>
                    <select class="form-input" id="emotion" data-id="emotion" name="emotion" required>
                        <option disabled selected value="">Select Emotion</option>
                        ${emotionsHTML}
                    </select>
                </div>`;
        }
    }
    getStyleGuidanceHMTL(){
        return `<div class="form-item" id="styleGuidanceSlide">
                    <label for="styleGuidance" class="form-label">Emotion Intensity</label>
                    <input type="range" name="styleGuidance" id="styleGuidance" min="1" max="30" value="15">
                </div>`;
    }
    async afterRender() {
        if (this.commands.speech && this.commands.speech.personality) {
            let personality = this.personalities.find(personality => personality.name === this.commands.speech.personality);
            let personalityId = personality.id;
            let personalityOption = this.element.querySelector(`option[value="${personalityId}"]`);
            personalityOption.selected = true;
            if(this.commands.speech.emotion){
                let emotionOption = this.element.querySelector(`option[value="${this.commands.speech.emotion}"]`);
                if(emotionOption){
                    emotionOption.selected = true;
                }
            }
            if(this.commands.speech.styleGuidance){
                let styleGuidance = this.element.querySelector(`#styleGuidance`);
                if(styleGuidance){
                    styleGuidance.value = this.commands.speech.styleGuidance;
                }
            }
        }
        if(this.commands.audio){
            let audioElement = this.element.querySelector(".paragraph-audio");
            audioElement.classList.remove("hidden");
            this.element.querySelector(".delete-audio").classList.remove("hidden");
            this.element.querySelector(".volume-item").classList.remove("hidden");
            let volumeInput = this.element.querySelector("#volume");
            volumeInput.value = this.commands.audio.volume;
            let saveVolumeButton = this.element.querySelector(".save-volume");
            volumeInput.addEventListener("input", async () => {
                let volume = parseFloat(volumeInput.value);
                audioElement.volume = volume / 100;
                if(volume !== this.commands.audio.volume){
                    saveVolumeButton.classList.remove("hidden");
                } else {
                    saveVolumeButton.classList.add("hidden");
                }
            });
            audioElement.src = await spaceModule.getAudioURL(this.commands.audio.id);
        }
        if(this.commands.speech){
            let deleteSpeechButton = this.element.querySelector(".delete-speech");
            deleteSpeechButton.classList.remove("hidden");
        }
        if(this.commands.silence){
            let currentSilenceElement = this.element.querySelector(".current-silence-time");
            currentSilenceElement.classList.remove("hidden");
            let silenceTime = this.element.querySelector(".silence-time");
            silenceTime.innerHTML = this.commands.silence.duration;
        }
        if(this.paragraph.text.trim() === ""){
            let warnMessage = `No text to convert to speech`;
            this.showSpeechWarning(warnMessage);
        }
        let personalitySelect = this.element.querySelector("#personality");
        personalitySelect.addEventListener("change", async (e) => {
            let personalityId = e.target.value;
            let selectedPersonality = this.personalities.find(personality => personality.id === personalityId).name;
            let emotionsHTML = await this.getEmotionsHTML(selectedPersonality);
            let emotionsSelect = this.element.querySelector("#emotionsSelect");
            if(emotionsSelect){
                emotionsSelect.remove();
            }
            let styleGuidanceSlide = this.element.querySelector("#styleGuidanceSlide");
            if(styleGuidanceSlide){
                styleGuidanceSlide.remove();
            }
            if(emotionsHTML){
                let personalityFormItem = this.element.querySelector(".personality-item");
                personalityFormItem.insertAdjacentHTML("afterend", emotionsHTML);
                let bottomRow = this.element.querySelector(".bottom-row");
                bottomRow.insertAdjacentHTML("afterbegin", this.getStyleGuidanceHMTL());
            }
        });
    }
    async saveVolume(button){
        let volumeInput = this.element.querySelector("#volume");
        this.commands.audio.volume = parseFloat(volumeInput.value);
        await this.commandsEditor.invalidateCompiledVideos();
        this.commandsEditor.videoPresenter.refreshVideoPreview();
        await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraphId, this.commands);
        button.classList.add("hidden");
    }
    showSpeechWarning(message){
        let warning = `
                <div class="paragraph-warning">
                    <img loading="lazy" src="./wallet/assets/icons/warning.svg" class="video-warning-icon" alt="warn">
                    <div class="warning-text">${message}</div>
                </div>`;
        let ttsSection = this.element.querySelector(".tts-section");
        ttsSection.insertAdjacentHTML("beforeend", warning);
    }
    async insertSpeech(_target) {
        const formData = await assistOS.UI.extractFormInformation(_target);
        if (!formData.isValid) {
            return;
        }
        let personalityName = this.personalities.find(personality => personality.id === formData.data.personality).name;
        let speech = {
            personality: personalityName,
            emotion: formData.data.emotion,
            styleGuidance: formData.data.styleGuidance
        };
        for(let key in speech){
            if(typeof speech[key] === "undefined"){
                delete speech[key];
            }
        }
        await this.commandsEditor.insertCommandWithTask("speech", speech);
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
    async deleteEffect(button, id){
        await this.commandsEditor.deleteCommand("effects", id);
        this.invalidate();
    }
    async insertSilence(targetElement) {
        let silenceInput = this.element.querySelector("#silence");
        let data = {
            duration: parseInt(silenceInput.value)
        }
        await this.commandsEditor.insertSimpleCommand("silence", data);
        this.invalidate();
    }
    closeModal(){
        assistOS.UI.closeModal(this.element);
    }
}
