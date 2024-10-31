const constants = require("assistos").constants;
const utilModule = require("assistos").loadModule("util", {});
const llmModule = require("assistos").loadModule("llm", {});
const spaceModule = require("assistos").loadModule("space", {});
const personalityModule = require("assistos").loadModule("personality", {});
import {NotificationRouter} from "../../../../imports.js";
export class EditPersonalityPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.knowledgeArray = [];
        this.refreshPersonality = async () => {
            this.personality = await personalityModule.getPersonality(assistOS.space.id, window.location.hash.split("/")[3]);
        }
        this.invalidate(async () => {
            await this.refreshPersonality();
            this.boundOnPersonalityUpdate = this.onPersonalityUpdate.bind(this);
            await NotificationRouter.subscribeToSpace(assistOS.space.id, this.personality.id, this.boundOnPersonalityUpdate);
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
        let voicesHTML = "";
        for (let voice of this.voices) {
            voicesHTML += `<option value="${voice.id}">${voice.name}, accent: ${voice.accent}, age: ${voice.age}, gender: ${voice.gender}, loudness: ${voice.loudness}, tempo: ${voice.tempo}</option>`;
        }
        this.voicesOptions = voicesHTML;
        if (this.personality.name === constants.DEFAULT_PERSONALITY_NAME) {
            this.disabled = "disabled";
        }
        if (this.personality.imageId) {
            this.photo = await spaceModule.getImageURL(this.personality.imageId);
        } else {
            this.photo = "./wallet/assets/images/default-personality.png";
        }
        this.personalityName = this.personality.name;
        let string = "";
        for (let fact of this.knowledgeArray) {
            string += `<div class="fact">${fact}</div>`;
        }
        this.filteredKnowledge = string;

        // let llmOptions = `<option value="" disabled selected hidden>Select LLM</option>`;
        // for(let llm of llmModule.models){
        //     llmOptions += `<option value="${llm.id}">${llm.name}</option>`;
        // }
        // this.llmOptions = llmOptions;
    }

    preventRefreshOnEnter(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            this.element.querySelector(".magnifier-container").click();
        }
    }

    afterRender() {
        let description = this.element.querySelector("textarea");
        description.innerHTML = this.personality.description;
        this.userInput = this.element.querySelector("#search");
        this.userInput.removeEventListener("keypress", this.boundFn);
        this.boundFn = this.preventRefreshOnEnter.bind(this);
        this.userInput.addEventListener("keypress", this.boundFn);

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

    async search(_target) {
        let form = this.element.querySelector(".search");
        let formInfo = await assistOS.UI.extractFormInformation(form);
        this.knowledgeArray = JSON.parse(await assistOS.space.getAgent().loadFilteredKnowledge(assistOS.space.id, formInfo.data.search));
        if (this.knowledgeArray.length === 0) {
            this.knowledgeArray = ["Nothing found"];
        }
        this.invalidate();
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
            if(this.photoAsFile){
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

    async addKnowledge(_target) {
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        let promiseArray = [];
        if (formInfo.isValid) {
            for (let file of formInfo.data.files) {
                promiseArray.push(await assistOS.UI.uploadFileAsText(file));
            }
            let files = await Promise.all(promiseArray);
            alert("save knowledge TBD")
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