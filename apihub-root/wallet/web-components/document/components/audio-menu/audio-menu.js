const llmModule = require("assistos").loadModule("llm", {});
const utilModule = require("assistos").loadModule("util", {});
const personalityModule = require("assistos").loadModule("personality", {});
const documentModule = require("assistos").loadModule("document", {});
const spaceModule = require("assistos").loadModule("space", {});
export class AudioMenu {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this._document = document.querySelector("document-view-page").webSkelPresenter._document;
        this.parentPresenter = this.element.closest("paragraph-item").webSkelPresenter;
        this.paragraphId = this.parentPresenter.paragraph.id;
        this.invalidate(async () => {
            this.personalities = await personalityModule.getPersonalities(assistOS.space.id);
            this.emotions = await llmModule.listEmotions(assistOS.space.id);
        });
        this.element.setAttribute("data-local-action", "editItem textToSpeech");
        this.element.setAttribute("id", "current-selection");
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
        this.audioConfig = JSON.parse(JSON.stringify(this.parentPresenter.paragraph.commands["speech"] || {}));

        if (this.audioConfig && this.audioConfig.personality) {
            const selectedPersonality = this.personalities.find(personality => personality.name === this.audioConfig.personality);
            if (selectedPersonality) {
                this.audioConfig.personality = selectedPersonality.id;
            }
        }
        this.paragraphText = this.parentPresenter.paragraph.text;
    }


    async afterRender() {
        if (this.audioConfig && this.audioConfig.personality) {
            let personalityOption = this.element.querySelector(`option[value="${this.audioConfig.personality}"]`);
            personalityOption.selected = true;
            if(this.audioConfig.emotion){
                let emotionOption = this.element.querySelector(`option[value="${this.audioConfig.emotion}"]`);
                emotionOption.selected = true;
            }
            let styleGuidance = this.element.querySelector(`#styleGuidance`);
            styleGuidance.value = this.audioConfig.styleGuidance || 15;
        }
        if(this.parentPresenter.paragraph.commands.audio){
            let audioElement = this.element.querySelector(".paragraph-audio");
            audioElement.classList.remove("hidden");
            this.element.querySelector(".delete-audio").classList.remove("hidden");
            audioElement.src = await spaceModule.getAudioURL(this.parentPresenter.paragraph.commands.audio.id);
        }
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
        const paragraphHeaderElement = this.parentPresenter.element.querySelector(".paragraph-commands");
        if(paragraphHeaderElement.tagName === "DIV"){
            const testCommands = JSON.parse(JSON.stringify(this.parentPresenter.paragraph.commands));
            testCommands.speech = commandConfig;

            const currentCommandsString = utilModule.buildCommandsString(testCommands);
            const currentCommandsObj = utilModule.findCommands(currentCommandsString);
            if (currentCommandsObj.invalid === true) {
                const errorElement = this.parentPresenter.element.querySelector(".error-message");
                if (errorElement.classList.contains("hidden")) {
                    errorElement.classList.remove("hidden");
                }
                errorElement.innerText = currentCommandsObj.error;
            } else {
                if(this.parentPresenter.paragraph.commands.speech){
                    await this.parentPresenter.handleCommand("speech", "changed");
                    commandConfig.taskId = this.parentPresenter.paragraph.commands.speech.taskId;
                    this.parentPresenter.paragraph.commands.speech = commandConfig;
                } else {
                    this.parentPresenter.paragraph.commands.speech = commandConfig;
                    await this.parentPresenter.handleCommand("speech", "new");
                }
                await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraphId, this.parentPresenter.paragraph.commands);
                await this.parentPresenter.renderViewModeCommands();
            }
        } else {
            paragraphHeaderElement.value += '\n';
            paragraphHeaderElement.value += utilModule.buildCommandString("speech", commandConfig);
            paragraphHeaderElement.style.height = paragraphHeaderElement.scrollHeight + "px";
        }
        this.parentPresenter.showUnfinishedTasks();
        this.element.remove();
    }
    async insertAudio(){
        await this.parentPresenter.openInsertAttachmentModal("", "audio");
        this.invalidate();
    }
    async deleteAudio(){
        await this.parentPresenter.deleteCommand("", "audio");
        this.invalidate();
    }
    async insertSoundEffect(){
        await this.parentPresenter.openInsertAttachmentModal("", "soundEffect");
        this.invalidate();
    }
    showSilencePopup(targetElement, mode) {
        if (mode === "off") {
            let popup = `<silence-popup data-presenter="silence-popup" data-paragraph-id="${this.parentPresenter.paragraph.id}"></silence-popup>`;
            this.parentPresenter.element.insertAdjacentHTML('beforeend', popup);
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
        let popup = this.parentPresenter.element.querySelector("silence-popup");
        if (popup) {
            popup.remove();
        }
        controller.abort();
    }
}
