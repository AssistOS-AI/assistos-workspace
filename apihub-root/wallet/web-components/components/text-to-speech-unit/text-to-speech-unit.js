const llmModule = require("assistos").loadModule("llm", {});
const documentModule = require("assistos").loadModule("document", {});
const personalityModule = require("assistos").loadModule("personality", {});
export class TextToSpeechUnit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this._document = document.querySelector("space-document-view-page").webSkelPresenter._document;
        this.chapterId = this.element.getAttribute("data-chapter-id");
        this.paragraphId = this.element.getAttribute("data-paragraph-id");
        this.generateBtnName = "Generate Audio";
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
        if(this.audioConfigs) {
            this.generateBtnName = "Regenerate Audio";
        }
    }
    afterRender() {
        let audioSource = this.element.querySelector('.audio-source');
        if(this.audioConfigs) {
            let audioSection = this.element.querySelector('.audio-section');
            let audioElement = this.element.querySelector('audio');
            audioSource.src = URL.createObjectURL(assistOS.services.base64ToBlob(this.audioConfigs.audioBlob));
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
        if(!formData.isValid){
            return;
        }
        let loaderId = await assistOS.UI.showLoading(_target);
        let paragraphUnit = assistOS.UI.reverseQuerySelector(_target, "space-paragraph-unit");
        let prompt = paragraphUnit.querySelector(".paragraph-text").value;
        if(!prompt || prompt === "") {
            alert("Write something!");
            return;
        }
        let personality = await assistOS.space.getPersonality(formData.data.personality);
        if(!personality.voiceId){
            alert("Personality does not have a voice assigned!");
            assistOS.UI.hideLoading(loaderId);
            return;
        }
        let audioBlob = await llmModule.textToSpeech(assistOS.space.id, {
            prompt: prompt,
            voice: personality.voiceId,
            emotion: formData.data.emotion,
            styleGuidance: formData.data.styleGuidance,
            modelName: "PlayHT2.0"
        });
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
            audioBlob: await assistOS.services.blobToBase64(audioBlob)
        }
        await documentModule.updateParagraphAudio(assistOS.space.id, this._document.id, this.paragraphId, audioConfigs);
        assistOS.UI.hideLoading(loaderId);
    }

    closePopup(_target) {
        this.element.remove();
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