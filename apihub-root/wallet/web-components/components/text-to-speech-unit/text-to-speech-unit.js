const llmModule = require("assistos").loadModule("llm", {});

export class TextToSpeechUnit {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate(async () => {
            this.personalities = await assistOS.space.getPersonalitiesMetadata();
            let configs = await llmModule.listVoicesAndEmotions(assistOS.space.id);
            this.voices = configs.voices;
            this.emotions = configs.emotions;
        });
    }

    beforeRender() {
        let personalitiesHTML = "";
        for (let personality of this.personalities) {
            personalitiesHTML += `<option value="${personality.id}">${personality.name}</option>`;
        }
        this.personalitiesHTML = personalitiesHTML;
        let voicesHTML = "";
        for (let voice of this.voices) {
            voicesHTML += `<option value="${voice.id}">${voice.name}</option>`;
        }
        this.voicesHTML = voicesHTML;
        let emotionsHTML = "";
        for (let emotion of this.emotions) {
            emotionsHTML += `<option value="${emotion}">${emotion}</option>`;
        }
        this.emotionsHTML = emotionsHTML;
    }

    async textToSpeech(_target) {
        let loaderId = await assistOS.UI.showLoading(_target);
        let formData = await assistOS.UI.extractFormInformation(_target);
        let paragraphUnit = assistOS.UI.reverseQuerySelector(_target, "space-paragraph-unit");
        let prompt = paragraphUnit.querySelector(".paragraph-text").innerText;
        if(!prompt || prompt === "") {
            alert("Write something!");
            return;
        }
        let audioURL = await llmModule.textToSpeech(assistOS.space.id, {
            prompt: prompt,
            voice: formData.data.voice,
            emotion: formData.data.emotion,
            styleGuidance: formData.data.styleGuidance
        });
        let audioSection = this.element.querySelector('.audio-section');
        audioSection.classList.remove('hidden');
        audioSection.classList.add('visible-section');
        let audioElement = this.element.querySelector('audio');
        let audioSource = this.element.querySelector('.audio-source');
        audioSource.src = URL.createObjectURL(audioURL);
        this.audioURL = audioSource.src;
        audioElement.load();
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

    closePopup(_target) {
        this.element.remove();
    }
}