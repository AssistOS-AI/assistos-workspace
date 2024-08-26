const llmModule = require("assistos").loadModule("llm", {});
const utilModule = require("assistos").loadModule("util", {});

export class TextToSpeech {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this._document = document.querySelector("document-view-page").webSkelPresenter._document;
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.paragraphId = this.element.getAttribute("data-paragraph-id");
        this.parentPresenter = this.element.parentElement.webSkelPresenter;
        this.invalidate(async () => {
            this.personalities = await assistOS.space.getPersonalitiesMetadata();
            this.emotions = await llmModule.listEmotions(assistOS.space.id);
        });
    }

    beforeRender() {
        let personalitiesHTML = "";
        for (let personality of this.personalities) {
            personalitiesHTML += `<option value="${personality.id}">${personality.name}</option>`;
        }
        this.personalitiesHTML = personalitiesHTML;
        let emotionsHTML = "";
        for (let emotion of this.emotions) {
            emotionsHTML += `<option value="${emotion}">${emotion}</option>`;
        }
        this.emotionsHTML = emotionsHTML;
        const command = utilModule.findCommands(this.parentPresenter.paragraph.text);
        this.audioConfig = command.paramsObject || null;
        if (this.audioConfig && this.audioConfig.personality) {
            this.audioConfig.personality = this.personalities.find(personality => personality.name === this.audioConfig.personality).id;
        }
        this.paragraphText = command.remainingText;
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
        const paragraphHeaderElement = this.parentPresenter.element.querySelector(".paragraph-configs");
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
            // Todo : decide the correct behavior
            //paragraphHeaderElement.innerText = `${currentCommandsString}` + "\n" + utilModule.buildCommandString("!speech", commandConfig)

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
