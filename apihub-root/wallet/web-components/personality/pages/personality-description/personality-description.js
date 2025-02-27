const llmModule = require("assistos").loadModule("llm", {});
const spaceModule = require("assistos").loadModule("space", {});
const personalityModule = require("assistos").loadModule("personality", {});
const constants = require("assistos").constants;

export class PersonalityDescription{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.personalityPagePresenter = this.element.closest("edit-personality-page").webSkelPresenter;
        this.personality = this.personalityPagePresenter.personality;
        this.invalidate();
    }
    constructLlmOptions(llmModels, llmType) {
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
    generateLlmSelectHtml(llmModels, llmType) {
        return `<div class="form-item">
            <label class="form-label" for="${llmType}LLM">${llmType} LLM</label>
            <select class="form-input" name="${llmType}LLM" id="${llmType}LLM">
                ${this.constructLlmOptions(llmModels, llmType)}
            </select>
        </div>`
    }
    generateLlmSection(availableLlms)  {
        let HTML = "";
        Object.keys(availableLlms).forEach(llmType => {
            HTML += this.generateLlmSelectHtml(availableLlms[llmType], llmType);
        })
        return HTML;
    }
    async beforeRender(){
        this.availableLlms = await llmModule.listLlms(assistOS.space.id);
        this.llmSelectionSection = this.generateLlmSection(this.availableLlms);
        if (this.personality.imageId) {
            try {
                this.photo = await spaceModule.getImageURL(this.personality.imageId);
            } catch (e) {
                this.photo = "./wallet/assets/images/default-personality.png";
            }
        } else {
            this.photo = "./wallet/assets/images/default-personality.png";
        }
        if (this.personality.name === constants.DEFAULT_PERSONALITY_NAME) {
            this.disabled = "disabled";
        }
        this.personalityName = this.personality.name;
    }
    afterRender(){
        let image = this.element.querySelector(".personality-photo");
        image.addEventListener("error", (e) => {
            e.target.src = "./wallet/assets/images/default-personality.png";
        });

        let description = this.element.querySelector("textarea");
        description.innerHTML = this.personality.description;

        let photoInput = this.element.querySelector("#photo");
        this.boundShowPhoto = this.showPhoto.bind(this, photoInput)
        photoInput.addEventListener("input", this.boundShowPhoto);


        Object.keys(this.availableLlms).forEach(type => {
            let element = this.element.querySelector(`#${type}LLM`);
            element.addEventListener("change", async (e) => {
                this.personality.llms[type] = e.target.value;
                this.personalityPagePresenter.checkSaveButtonState();
            });
        });
        let nameInput = this.element.querySelector("#name");
        nameInput.addEventListener("input", (e) => {
            this.personality.name = assistOS.UI.sanitize(e.target.value);
            this.personalityPagePresenter.checkSaveButtonState();
        });
        let descriptionInput = this.element.querySelector("#description");
        descriptionInput.addEventListener("input", (e) => {
            this.personality.description = assistOS.UI.sanitize(e.target.value);
            this.personalityPagePresenter.checkSaveButtonState();
        });
    }
    preventRefreshOnEnter(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            this.element.querySelector(".magnifier-container").click();
        }
    }
    verifyPhotoSize(element)  {
        if (element.files.length > 0) {
            return element.files[0].size <= 1048576 * 5; // 5MB
        }
        return true;
    };
    async showPhoto(photoInput, event) {
        if (!this.verifyPhotoSize(photoInput)) {
            assistOS.showToast("The file size should not exceed 5MB");
            return;
        }
        let photoContainer = this.element.querySelector(".personality-photo");
        this.personalityPagePresenter.photoAsFile = photoInput.files[0];
        photoContainer.src = await assistOS.UI.imageUpload(photoInput.files[0]);
        this.personalityPagePresenter.checkSaveButtonState();
    }

    triggerInputFileOpen(_target, id) {
        _target.removeAttribute("data-local-action");
        let input = this.element.querySelector(`#${id}`);
        input.click();
        _target.setAttribute("data-local-action", `triggerInputFileOpen ${id}`);
    }
}