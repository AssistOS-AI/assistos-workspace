const constants = require("assistos").constants;
const utilModule = require("assistos").loadModule("util", {});
const llmModule = require("assistos").loadModule("llm", {});

export class EditPersonalityPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.knowledgeArray = [];
        this.refreshPersonality = async () => {
            this.personality = await assistOS.space.getPersonality(window.location.hash.split("/")[3]);
        }
        this.invalidate(async () => {
            await this.refreshPersonality();
            await utilModule.subscribeToObject(this.personality.id, async (type) => {
                if (type === "delete") {
                    await this.openPersonalitiesPage();
                    alert("The personality has been deleted");
                } else {
                    this.invalidate(this.refreshPersonality);
                }
            });
            /* TODO temporary fix endpoint should be called only if the api Key is set */
            try {
                this.configs = await llmModule.listVoicesAndEmotions(assistOS.space.id);
                this.voices = this.configs.voices;
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
                this.configs = {}
                this.voices=[]
            }
        });
    }

    beforeRender() {
        let voicesHTML = "";
        for (let voice of this.voices) {
            voicesHTML += `<option value="${voice.id}">${voice.name}, accent: ${voice.accent}, age: ${voice.age}, gender: ${voice.gender}, loudness: ${voice.loudness}, tempo: ${voice.tempo}</option>`;
        }
        this.voicesOptions = voicesHTML;
        if (this.personality.name === constants.PERSONALITIES.DEFAULT_PERSONALITY_NAME) {
            this.disabled = "disabled";
        }
        if (this.personality.image) {
            this.photo = this.personality.image;
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

    async afterUnload() {
        await utilModule.unsubscribeFromObject(this.personality.id);
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
        if (this.personality.voiceId) {
            let audioSource = this.element.querySelector('.audio-source');
            let audioSection = this.element.querySelector(".audio-section");
            let voice = this.voices.find(voice => voice.id === this.personality.voiceId);
            audioSection.classList.remove("hidden");
            voiceSelect.value = this.personality.voiceId;
            audioSource.src = voice.sample;
            audioSource.load();
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
        let encodedPhoto = await assistOS.UI.imageUpload(photoInput.files[0]);
        photoContainer.src = encodedPhoto;
        this.photo = encodedPhoto;
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
                return element.files[0].size <= 1048576;
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
            this.personality.name = formInfo.data.name || this.personality.name;
            this.personality.description = formInfo.data.description;
            this.personality.image = this.photo;
            this.personality.voiceId = formInfo.data.voiceId;
            await assistOS.callFlow("UpdatePersonality", {
                spaceId: assistOS.space.id,
                personalityData: this.personality,
                personalityId: this.personality.id
            });
            await this.openPersonalitiesPage();
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
}