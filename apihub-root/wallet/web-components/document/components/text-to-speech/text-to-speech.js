const llmModule = require("assistos").loadModule("llm", {});
const utilModule = require("assistos").loadModule("util", {});
const personalityModule = require("assistos").loadModule("personality", {});

export class TextToSpeech {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this._document = document.querySelector("document-view-page").webSkelPresenter._document;
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.paragraphId = this.element.getAttribute("data-paragraph-id");
        this.parentPresenter = this.element.parentElement.webSkelPresenter;
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
                configuredPersonalitiesFound ++;
            }
        }

        if (configuredPersonalitiesFound===0) {
            personalitiesHTML += `<option value="default" disabled>No personalities with voice</option>`;
        }else if(configuredPersonalitiesFound<=this.personalities.length){
            personalitiesHTML += `<option value="default" disabled>${this.personalities.length - configuredPersonalitiesFound} personalities unconfigured</option>`;
        }

        this.personalitiesHTML = personalitiesHTML;

        let emotionsHTML = "";
        for (let emotion of this.emotions) {
            emotionsHTML += `<option value="${emotion}">${emotion}</option>`;
        }
        this.emotionsHTML = emotionsHTML;

        const audioCommand = this.parentPresenter.paragraph.commands["speech"];
        this.audioConfig = null;

        if (audioCommand) {
            this.audioConfig = audioCommand.paramsObject;
        }

        if (this.audioConfig && this.audioConfig.personality) {
            const selectedPersonality = this.personalities.find(personality => personality.name === this.audioConfig.personality);
            if (selectedPersonality) {
                this.audioConfig.personality = selectedPersonality.id;
            }
        }
        this.paragraphText = this.parentPresenter.paragraph.text;
    }


    afterRender() {
        if (this.audioConfig && this.audioConfig.personality) {
            let personalityOption = this.element.querySelector(`option[value="${this.audioConfig.personality}"]`);
            personalityOption.selected = true;
            let emotionOption = this.element.querySelector(`option[value="${this.audioConfig.emotion}"]`);
            emotionOption.selected = true;
            let styleGuidance = this.element.querySelector(`#styleGuidance`);
            styleGuidance.value = this.audioConfig.styleGuidance || 15;
            let temperature = this.element.querySelector(`#temperature`);
            temperature.value = this.audioConfig.temperature || 1;
            let voiceGuidance = this.element.querySelector(`#voiceGuidance`);
            voiceGuidance.value = this.audioConfig.voiceGuidance || 3;
        }
    }

    async textToSpeech(_target) {
        const formData = await assistOS.UI.extractFormInformation(_target);
        if (!formData.isValid) {
            return;
        }
        const commandConfig = {
            personality: this.personalities.find((personality) => personality.id === formData.data.personality).name,
            emotion: formData.data.emotion,
            styleGuidance: formData.data.styleGuidance,
            voiceGuidance: formData.data.voiceGuidance,
            temperature: formData.data.temperature,
        }
        const paragraphHeaderElement = this.parentPresenter.element.querySelector(".paragraph-commands");
        const currentCommandsString = paragraphHeaderElement.value
            .replace(/\n/g, "");
        const currentCommandsObj = utilModule.findCommands(currentCommandsString);
        if (currentCommandsObj.invalid === true) {
            /* invalid command string -> just append the !speech command*/
            const errorElement = this.parentPresenter.element.querySelector(".error-message");
            if (errorElement.classList.contains("hidden")) {
                errorElement.classList.remove("hidden");
            }
            errorElement.innerText = currentCommandsObj.error;

        } else {
            /* valid command string */
            if (currentCommandsObj["speech"]) {
                /* !speech command already exists -> update it */
                paragraphHeaderElement.value = utilModule.updateCommandsString("speech", commandConfig, currentCommandsString)
            } else {
                /* !speech command does not exist -> append it */
                paragraphHeaderElement.value = `${currentCommandsString}` + "\n" + utilModule.buildCommandString("speech", commandConfig)
            }
        }
        this.element.remove();
    }
}
