import {unescapeHtmlEntities} from "../../../../imports.js";

const llmModule = require("assistos").loadModule("llm", {});
const documentModule = require("assistos").loadModule("document", {});
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
        this.audioConfig = this.parentPresenter.paragraph.audioConfig;

    }

    afterRender() {
        if (this.audioConfig) {
            let personalityOption = this.element.querySelector(`option[value="${this.audioConfig.personalityId}"]`);
            personalityOption.selected = true;
            let emotionOption = this.element.querySelector(`option[value="${this.audioConfig.emotion}"]`);
            emotionOption.selected = true;
            let styleGuidance = this.element.querySelector(`#styleGuidance`);
            styleGuidance.value = this.audioConfig.styleGuidance;
            let temperature = this.element.querySelector(`#temperature`);
            temperature.value = this.audioConfig.temperature;
            let voiceGuidance = this.element.querySelector(`#voiceGuidance`);
            voiceGuidance.value = this.audioConfig.voiceGuidance;
        }
    }

    async textToSpeech(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (!formData.isValid) {
            return;
        }
        let loaderId = await assistOS.UI.showLoading(_target);
        let personality = await assistOS.space.getPersonality(formData.data.personality);
        const paragraphElement = assistOS.UI.reverseQuerySelector(_target, "paragraph-item");
        const chapterElement = assistOS.UI.reverseQuerySelector(paragraphElement, "chapter-item");

        const paragraphText = paragraphElement.webSkelPresenter.paragraph.text;

        let audioConfig = {
            personalityId: formData.data.personality,
            voiceId: personality.voiceId,
            emotion: formData.data.emotion,
            styleGuidance: formData.data.styleGuidance,
            voiceGuidance: formData.data.voiceGuidance,
            temperature: formData.data.temperature,
            prompt: unescapeHtmlEntities(paragraphText)
        }

        await documentModule.updateParagraphAudioConfigs(assistOS.space.id, this._document.id, this.paragraphId, audioConfig);
        const paragraphCommand = `!speech personality=${personality.name} emotion=${formData.data.emotion} intensity=${formData.data.styleGuidance} variance=${formData.data.temperature} uniqueness=${formData.data.voiceGuidance}:`;
        const paragraphPosition = chapterElement.webSkelPresenter.chapter.getParagraphIndex(assistOS.space.currentParagraphId) + 1;

        const chapterPresenter = chapterElement.webSkelPresenter;
        let updatedText = "";

        if (!paragraphElement.webSkelPresenter.paragraph.audio) {
            updatedText = paragraphCommand + paragraphText;
        } else {
            updatedText = paragraphCommand+utilModule.findCommand(paragraphText).remainingText
        }

        await assistOS.callFlow("UpdateParagraphText", {
            spaceId: assistOS.space.id,
            documentId: this._document.id,
            chapterId: chapterElement.webSkelPresenter.chapter.id,
            paragraphId: paragraphElement.webSkelPresenter.paragraph.id,
            position: paragraphPosition,
            text: updatedText
        });

        chapterPresenter.invalidate(chapterPresenter.refreshChapter);
        assistOS.UI.hideLoading(loaderId);
    }

    /*  downloadAudio(_target) {
          const link = document.createElement('a');
          link.href = this.audioURL;
          link.download = 'audio.mp3';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }*/
}