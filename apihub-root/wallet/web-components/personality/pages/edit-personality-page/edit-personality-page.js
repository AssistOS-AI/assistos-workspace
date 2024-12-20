const constants = require("assistos").constants;
const llmModule = require("assistos").loadModule("llm", {});
const spaceModule = require("assistos").loadModule("space", {});
const personalityModule = require("assistos").loadModule("personality", {});

export class EditPersonalityPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.refreshPersonality = async () => {
            this.personality = await personalityModule.getPersonality(assistOS.space.id, window.location.hash.split("/")[3]);
        }
        this.invalidate(async () => {
            await this.refreshPersonality();
            this.boundOnPersonalityUpdate = this.onPersonalityUpdate.bind(this);
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, this.personality.id, this.boundOnPersonalityUpdate);
            /* TODO temporary fix endpoint should be called only if the api Key is set */
            try {
                this.voices = await llmModule.listVoices(assistOS.space.id);
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
        });
    }

    async onPersonalityUpdate(type) {
        if (type === "delete") {
            await this.openPersonalitiesPage();
            alert("The personality has been deleted");
        } else {
            this.invalidate(this.refreshPersonality);
        }
    }

    async beforeRender() {
        // Generate Dynamically the LLM selection section to automatize the process of adding new LLMs and new LLM types and make it more extensible
        const constructLlmOptions = (llmModels, llmType) => {
            let options = [];

            if (this.personality.llms[llmType]) {
                options.push(`<option value="${this.personality.llms[llmType]}" selected>${this.personality.llms[llmType]}</option>`);
            } else {
                options.push(`<option value="" disabled selected hidden>Select ${llmType} Model</option>`);
            }

            llmModels.forEach(llm => {
                if(this.personality.llms[llmType] !== llm) {
                    options.push(`<option value="${llm}">${llm}</option>`);
                }
            });
            return options.join('');
        };
        const generateLlmSelectHtml = (llmModels, llmType) => {
            return `<div class="form-item">
            <label class="form-label" for="${llmType}LLM">${llmType} LLM</label>
            <select name="${llmType}LLM" id="${llmType}LLM">
                ${constructLlmOptions(llmModels, llmType)}
            </select>
        </div>`
        }
        const generateLlmSection = (availableLlms) => {
            let HTML = "";
            Object.keys(availableLlms).forEach(llmType => {
                HTML += generateLlmSelectHtml(availableLlms[llmType], llmType);
            })
            return HTML;
        }

        this.availableLlms = await llmModule.listLlms(assistOS.space.id);

        this.llmSelectionSection = generateLlmSection(this.availableLlms);

        let voicesHTML = "";
        for (let voice of this.voices) {
            voicesHTML += `<option value="${voice.id}">${voice.name}, accent: ${voice.accent}, age: ${voice.age}, gender: ${voice.gender}, loudness: ${voice.loudness}, tempo: ${voice.tempo}</option>`;
        }
        this.voicesOptions = voicesHTML;
        if (this.personality.name === constants.DEFAULT_PERSONALITY_NAME) {
            this.disabled = "disabled";
        }
        if (this.personality.imageId) {
            try {
                this.photo = await spaceModule.getImageURL(this.personality.imageId);
            } catch (e) {
                this.photo = "./wallet/assets/images/default-personality.png";
            }
        } else {
            this.photo = "./wallet/assets/images/default-personality.png";
        }
        this.personalityName = this.personality.name;
    }

    async afterRender() {
        const attachSelectHandlers = () => {
            Object.keys(this.availableLlms).forEach(llmType => {
                this.element.querySelector(`#${llmType}LLM`).addEventListener("change", this.updateLlm.bind(this, llmType));
            });
        }
        attachSelectHandlers();
        let description = this.element.querySelector("textarea");
        description.innerHTML = this.personality.description;
        this.boundFn = this.preventRefreshOnEnter.bind(this);

        let photoInput = this.element.querySelector("#photo");
        if (this.boundShowPhoto) {
            photoInput.removeEventListener("input", this.boundShowPhoto);
        }
        this.boundShowPhoto = this.showPhoto.bind(this, photoInput)
        photoInput.addEventListener("input", this.boundShowPhoto);
        let voiceSelect = this.element.querySelector("#voiceId");
        if (this.personality.voiceId && !this.voicesErrorMessage) {
            let audioSource = this.element.querySelector('.audio-source');
            let audioSection = this.element.querySelector(".audio-section");
            let voice = this.voices.find(voice => voice.id === this.personality.voiceId);
            audioSection.classList.remove("hidden");
            voiceSelect.value = this.personality.voiceId;
            audioSource.src = voice.sample;
            audioSource.load();
        }
        if (this.voicesErrorMessage) {
            voiceSelect.innerHTML = `<option value="" disabled selected hidden>${this.voicesErrorMessage}</option>`;
        }

        if (!this.boundSelectVoiceHndler) {
            this.boundSelectVoiceHndler = this.selectVoiceHandler.bind(this, voiceSelect);
            voiceSelect.addEventListener("change", this.boundSelectVoiceHndler);
        }
    }

    async updateLlm(llmType, event) {
        let llm = this.element.querySelector(`#${llmType}LLM`).value;
        this.personality.llms[llmType] = llm;
        await personalityModule.updatePersonality(assistOS.space.id, this.personality.id, this.personality);
    }


    preventRefreshOnEnter(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            this.element.querySelector(".magnifier-container").click();
        }
    }

    selectVoiceHandler(voiceSelect, event) {
        let audioSection = this.element.querySelector(".audio-section");
        if (voiceSelect.value) {
            let audioSource = this.element.querySelector('.audio-source');
            let voice = this.voices.find(voice => voice.id === voiceSelect.value);
            audioSection.classList.remove("hidden");
            audioSource.src = voice.sample;
            audioSource.load();
        } else {
            audioSection.classList.add("hidden");
        }
    }

    async showPhoto(photoInput, event) {
        let photoContainer = this.element.querySelector(".personality-photo");
        this.photoAsFile = photoInput.files[0];
        photoContainer.src = await assistOS.UI.imageUpload(photoInput.files[0]);
    }


    triggerInputFileOpen(_target, id) {
        _target.removeAttribute("data-local-action");
        let input = this.element.querySelector(`#${id}`);
        input.click();
        _target.setAttribute("data-local-action", `triggerInputFileOpen ${id}`);
    }

    async saveChanges(_target) {
        const verifyPhotoSize = (element) => {
            if (element.files.length > 0) {
                return element.files[0].size <= 1048576 * 20; // 20MB
            }
            return true;
        };
        const conditions = {
            "verifyPhotoSize": {
                fn: verifyPhotoSize,
                errorMessage: "Image too large! Image max size: 1MB"
            }
        };
        let formInfo = await assistOS.UI.extractFormInformation(_target, conditions);
        if (formInfo.isValid) {
            if (this.photoAsFile) {
                let reader = new FileReader();
                reader.onload = async (e) => {
                    const uint8Array = new Uint8Array(e.target.result);
                    let imageId = await spaceModule.putImage(uint8Array);
                    this.personality.name = formInfo.data.name || this.personality.name;
                    this.personality.description = formInfo.data.description;
                    this.personality.imageId = imageId;
                    this.personality.voiceId = formInfo.data.voiceId;
                    await personalityModule.updatePersonality(assistOS.space.id, this.personality.id, this.personality);
                    await this.openPersonalitiesPage();
                };
                reader.readAsArrayBuffer(this.photoAsFile);
            } else {
                this.personality.name = formInfo.data.name || this.personality.name;
                this.personality.description = formInfo.data.description;
                this.personality.voiceId = formInfo.data.voiceId;
                await personalityModule.updatePersonality(assistOS.space.id, this.personality.id, this.personality);
                await this.openPersonalitiesPage();
            }
        }
    }

    async deletePersonality() {
        await assistOS.callFlow("DeletePersonality", {
            spaceId: assistOS.space.id,
            personalityId: this.personality.id
        });
        await this.openPersonalitiesPage();
    }

    async openPersonalitiesPage() {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/personalities-page`);
    }

    async exportPersonality(_target) {
        try {
            const spaceId = assistOS.space.id;
            const personalityId = this.personality.id;

            const blob = await personalityModule.exportPersonality(spaceId, personalityId);
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${this.personality.name}.persai`;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            alert("Exporting personality failed");
        }
    }
}
