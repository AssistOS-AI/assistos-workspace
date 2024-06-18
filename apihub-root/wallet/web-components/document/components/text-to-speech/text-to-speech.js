import {base64ToBlob, blobToBase64} from "../../../../imports.js";

const llmModule = require("assistos").loadModule("llm", {});
const documentModule = require("assistos").loadModule("document", {});

export class TextToSpeech {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this._document = document.querySelector("document-view-page").webSkelPresenter._document;
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.paragraphId = this.element.getAttribute("data-paragraph-id");
        this.generateBtnName = "Generate";
        this.invalidate(async () => {
            this.personalities = await assistOS.space.getPersonalitiesMetadata();
            let configs = await llmModule.listVoicesAndEmotions(assistOS.space.id);
            this.emotions = configs.emotions;
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
        this.audioConfigs = this._document.getParagraphAudio(this.chapterId, this.paragraphId);
        if (this.audioConfigs) {
            this.generateBtnName = "Regenerate";
        }
    }

    afterRender() {
        let audioSource = this.element.querySelector('.audio-source');
        if (this.audioConfigs) {
            let audioSection = this.element.querySelector('.audio-section');
            let audioElement = this.element.querySelector('audio');
            audioSource.src = URL.createObjectURL(base64ToBlob(this.audioConfigs.audioBlob, "audio/mp3"));
            this.audioURL = audioSource.src;
            audioSection.classList.remove('hidden');
            audioSection.classList.add('visible-section');
            audioElement.load();
            let personalityOption = this.element.querySelector(`option[value="${this.audioConfigs.personalityId}"]`);
            personalityOption.selected = true;
            let emotionOption = this.element.querySelector(`option[value="${this.audioConfigs.emotion}"]`);
            emotionOption.selected = true;
            let styleGuidance = this.element.querySelector(`#styleGuidance`);
            styleGuidance.value = this.audioConfigs.styleGuidance;
        }
    }

    async textToSpeech(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (!formData.isValid) {
            return;
        }
        let loaderId = await assistOS.UI.showLoading(_target);
        let prompt;
        if (this.audioConfigs) {
            prompt = this.audioConfigs.prompt;
        } else {
            let paragraphItem = assistOS.UI.reverseQuerySelector(_target, "paragraph-item");
            let paragraphPresenter = paragraphItem.webSkelPresenter;
            prompt = paragraphPresenter.selectionText;
            paragraphPresenter.hasAudio = true;
        }
        if (!prompt || prompt === "") {
            alert("Nothing selected!");
            assistOS.UI.hideLoading(loaderId);
            return;
        }
        let personality = await assistOS.space.getPersonality(formData.data.personality);
        if (!personality.voiceId) {
            alert("Personality does not have a voice assigned!");
            assistOS.UI.hideLoading(loaderId);
            return;
        }
        let audioBlob;
        try {
            audioBlob = (await assistOS.callFlow("TextToSpeech", {
                spaceId: assistOS.space.id,
                prompt: prompt,
                voiceId: personality.voiceId,
                voiceConfigs: {
                    emotion: formData.data.emotion,
                    styleGuidance: formData.data.styleGuidance
                },
                modelName: "PlayHT2.0"
            })).data;
        } catch (e) {
            let message = assistOS.UI.sanitize(e.message);
            return await showApplicationError(message, message, message);
        }

        let audioSection = this.element.querySelector('.audio-section');
        audioSection.classList.remove('hidden');
        audioSection.classList.add('visible-section');
        let audioElement = this.element.querySelector('audio');
        let audioSource = this.element.querySelector('.audio-source');
        audioSource.src = URL.createObjectURL(audioBlob);
        this.audioURL = audioSource.src;
        audioElement.load();
        let audioConfigs = {
            personalityId: formData.data.personality,
            voiceId: formData.data.voice,
            emotion: formData.data.emotion,
            styleGuidance: formData.data.styleGuidance,
            audioBlob: await blobToBase64(audioBlob),
            prompt: prompt
        }
        await documentModule.updateParagraphAudio(assistOS.space.id, this._document.id, this.paragraphId, audioConfigs);
        assistOS.UI.hideLoading(loaderId);
    }

    downloadAudio(_target) {
        const link = document.createElement('a');
        link.href = this.audioURL;
        link.download = 'audio.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}