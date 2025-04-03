const llmModule = require("assistos").loadModule("llm", {});

export class AgentAudio {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.agentPagePresenter = this.element.closest("edit-agent-page").webSkelPresenter;
        this.agent = this.agentPagePresenter.agent;
        this.invalidate(async ()=>{
            await this.loadVoices(this.agent.llms["audio"]);
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
    async beforeRender(){
        let availableLlms = await llmModule.listLlms(assistOS.space.id);
        this.audioLLMSection = this.agentPagePresenter.generateLlmSelectHtml(availableLlms["audio"], "audio");
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
        if (this.agent.voiceId && !this.voicesErrorMessage) {
            let audioSource = this.element.querySelector('.audio-source');
            let audioSection = this.element.querySelector(".audio-section");
            let voice = this.voices.find(voice => voice.id === this.agent.voiceId);
            if(voice){
                audioSection.classList.remove("hidden");
                voiceSelect.value = this.agent.voiceId;
                audioSource.src = voice.sample;
                audioSource.load();
            }
        }
        if (this.voicesErrorMessage) {
            voiceSelect.innerHTML = `<option value="" disabled selected hidden>${this.voicesErrorMessage}</option>`;
        }

        this.boundSelectVoiceHndler = this.selectVoiceHandler.bind(this, voiceSelect);
        voiceSelect.addEventListener("change", this.boundSelectVoiceHndler);
        let audioSelect = this.element.querySelector(`#audioLLM`);
        audioSelect.addEventListener("change", async (e) => {
            this.agent.llms.audio = e.target.value;
            this.agentPagePresenter.checkSaveButtonState();
        });
        audioSelect.addEventListener("change", async ()=>{
            this.invalidate(async () => {
                this.agent.llms["audio"] = audioSelect.value;
                await this.loadVoices(audioSelect.value);
            });
        });
    }

    selectVoiceHandler(voiceSelect, event) {
        let audioSection = this.element.querySelector(".audio-section");
        if (voiceSelect.value) {
            let audioSource = this.element.querySelector('.audio-source');
            let voice = this.voices.find(voice => voice.id === voiceSelect.value);
            audioSection.classList.remove("hidden");
            audioSource.src = voice.sample;
            audioSource.load();
            this.agent.voiceId = voiceSelect.value;
            this.agentPagePresenter.checkSaveButtonState();
        } else {
            audioSection.classList.add("hidden");
        }
    }
}