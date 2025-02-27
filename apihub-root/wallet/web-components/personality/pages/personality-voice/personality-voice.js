const llmModule = require("assistos").loadModule("llm", {});

export class PersonalityVoice{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.personalityPagePresenter = this.element.closest("edit-personality-page").webSkelPresenter;
        this.personality = this.personalityPagePresenter.personality;
        this.invalidate(async ()=>{
            await this.loadVoices(this.personality.llms["audio"]);
        });
    }
    async loadVoices(modelName){
        this.voicesErrorMessage = "";
        try {
            this.voices = await llmModule.listVoices(assistOS.space.id, modelName);
            this.voices.sort((a, b) => {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            });
        } catch (error) {
            this.voices = [];
            this.voicesErrorMessage = error.message;
        }
    }
    beforeRender(){
        let voicesHTML = "";

        for (let voice of this.voices) {
            let accent = voice.accent ? `, accent: ${voice.accent}` : "";
            let age = voice.age ? `, age: ${voice.age}` : "";
            let gender = voice.gender ? `, gender: ${voice.gender}` : "";
            let loudness = voice.loudness ? `, loudness: ${voice.loudness}` : "";
            let tempo = voice.tempo ? `, tempo: ${voice.tempo}` : "";
            voicesHTML += `<option value="${voice.id}">${voice.name}${accent}${age}${gender}${loudness}${tempo}</option>`;
        }

        this.voicesOptions = voicesHTML;
    }
    afterRender(){
        let voiceSelect = this.element.querySelector("#voiceId");
        if (this.personality.voiceId && !this.voicesErrorMessage) {
            let audioSource = this.element.querySelector('.audio-source');
            let audioSection = this.element.querySelector(".audio-section");
            let voice = this.voices.find(voice => voice.id === this.personality.voiceId);
            if(voice){
                audioSection.classList.remove("hidden");
                voiceSelect.value = this.personality.voiceId;
                audioSource.src = voice.sample;
                audioSource.load();
            }
        }
        if (this.voicesErrorMessage) {
            voiceSelect.innerHTML = `<option value="" disabled selected hidden>${this.voicesErrorMessage}</option>`;
        }

        this.boundSelectVoiceHndler = this.selectVoiceHandler.bind(this, voiceSelect);
        voiceSelect.addEventListener("change", this.boundSelectVoiceHndler);

        // let audioSelect = this.element.querySelector("#audioLLM");
        // audioSelect.addEventListener("change", async ()=>{
        //     this.invalidate(async () => {
        //         this.personality.llms["audio"] = audioSelect.value;
        //         await this.loadVoices(audioSelect.value);
        //     });
        // });
    }

    selectVoiceHandler(voiceSelect, event) {
        let audioSection = this.element.querySelector(".audio-section");
        if (voiceSelect.value) {
            let audioSource = this.element.querySelector('.audio-source');
            let voice = this.voices.find(voice => voice.id === voiceSelect.value);
            audioSection.classList.remove("hidden");
            audioSource.src = voice.sample;
            audioSource.load();
            this.personality.voiceId = voiceSelect.value;
            this.personalityPagePresenter.checkSaveButtonState();
        } else {
            audioSection.classList.add("hidden");
        }
    }
}