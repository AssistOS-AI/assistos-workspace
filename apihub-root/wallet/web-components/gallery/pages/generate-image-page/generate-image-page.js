import {executorTimer} from "../../../../imports.js";
const galleryModule = require("assistos").loadModule("gallery", {});
const llmModule = require("assistos").loadModule("llm", {});
export class GenerateImagePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.id = window.location.hash.split("/")[3];
        this.refreshHistory = async () => {
            this.currentModel = this.models.find((model) => model.name === this.galleryConfig.commonConfig.modelName);
            if (this.galleryConfig.mode === "OpenAI") {
                this.images = await galleryModule.getGalleryOpenAIHistory(assistOS.space.id, this.id);
            } else {
                this.images = await galleryModule.getGalleryMidjourneyHistory(assistOS.space.id, this.id);
            }
        }
        this.invalidate(async () => {
            this.personalities = await assistOS.space.getPersonalitiesMetadata();
            this.models = [];
            let configs = await llmModule.getLLMConfigs(assistOS.space.id);
            for (let companyObj of configs) {
                for (let model of companyObj.models) {
                    if (model.type === "image") {
                        model.companyName = companyObj.company;
                        this.models.push(model);
                    }
                }
            }
            this.galleryConfig = await galleryModule.getGalleryConfig(assistOS.space.id, this.id);
            await this.refreshHistory();
        });
        this.boundOnImageUpdate = this.onImageUpdate.bind(this);
        assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, this.id, this.boundOnImageUpdate);
        this.selectInputs = [];
    }
    async onImageUpdate(type) {
        switch (type) {
            case "delete":
                return this.invalidate(async () => {
                    await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/galleries-page`);
                    alert("The gallery has been deleted");
                });
            case "config":
                let galleryConfig = await galleryModule.getGalleryConfig(assistOS.space.id, this.id);
                if (JSON.stringify(this.galleryConfig) !== JSON.stringify(galleryConfig)) {
                    this.galleryConfig = galleryConfig;
                    this.invalidate(this.refreshHistory);
                }
                return;
            default:
                this.invalidate(this.refreshHistory);
                return;
        }
    }
    openAIBeforeRender() {
        let imagesHTML = "";
        for (let image of this.images) {
            imagesHTML += `<history-image data-id="${image.id}" data-has-buttons="false" data-presenter="history-image"></history-image>`;
        }
        this.imagesSection = imagesHTML;
        let variantsHTML = "";
        for (let i = 1; i <= this.currentModel.variants; i++) {
            variantsHTML += `<option value="${i}">${i}</option>`;
        }
        this.variantsSelect = `
        <div class="select-container">
            <label class="form-label" for="variants">Variants</label>
            <select class="select-variants config-select" id="variants" data-id="variants" name="variants">
                ${variantsHTML}
            </select>
        </div>`;
        let sizesHTML = "";
        for (let size of this.currentModel.size) {
            sizesHTML += `<option value="${size}">${size}</option>`;
        }
        this.sizeSelect = `
        <div class="select-container">
            <label class="form-label" for="size">Select Size</label>
            <select class="select-size config-select" id="size" data-id="size" name="size">
                 ${sizesHTML}
            </select>
        </div>`;
        let stylesHTML = "";
        for (let style of this.currentModel.style) {
            stylesHTML += `<option value="${style}">${style}</option>`;
        }
        this.styleSelect = `
        <div class="select-container">
            <label class="form-label" for="style">Select Style</label>
            <select class="select-style config-select" id="style" data-id="style" name="style">
                ${stylesHTML}
            </select>
        </div>`;
        let qualityHTML = "";
        for (let quality of this.currentModel.quality) {
            qualityHTML += `<option value="${quality}">${quality}</option>`;
        }
        this.qualitySelect = `
        <div class="select-container">
            <label class="form-label" for="quality">Select Quality</label>
            <select class="select-quality config-select" id="quality" data-id="quality" name="quality">
                ${qualityHTML}
            </select>
        </div>`;

    }

    midjourneyBeforeRender() {
        this.variantsSelect = "";
        this.sizeSelect = "";
        this.styleSelect = "";
        this.qualitySelect = "";
        let imagesHTML = "";
        for (let image of this.images) {
            imagesHTML += `<history-image data-id="${image.id}" data-has-buttons="true" data-presenter="history-image"></history-image>`;
        }
        this.imagesSection = imagesHTML;
    }

    beforeRender() {
        let personalitiesHTML = `<option selected value="">None</option>`;
        for (let personality of this.personalities) {
            personalitiesHTML += `<option value="${personality.id}">${personality.name}</option>`;
        }
        this.personalitiesHTML = personalitiesHTML;
        this.llms = "";
        for (let model of this.models) {
            this.llms += `<option value="${model.name}">${model.name}</option>`;
        }
        if (this.galleryConfig.mode === "OpenAI") {
            this.openAIBeforeRender();
        } else {
            this.midjourneyBeforeRender();
        }
    }

    async getImageSrc(_target) {
        let imageItem = _target.closest(".image-item");
        let image = imageItem.querySelector("img");
        const pattern = /^http/;
        if (pattern.test(image.src)) {
            const response = await fetch(image.src);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const blob = await response.blob();
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = () => {
                    resolve(reader.result);
                };
                reader.onerror = () => {
                    reject(new Error('FileReader error'));
                };
                reader.readAsDataURL(blob);
            });
        }
        return image.src;
    }

    async saveImage(_target, id, type) {
        let image = this.images.find((image) => image.id === id);
        image.saved = true;
        if(type === "openAI") {
            await galleryModule.updateOpenAIHistoryImage(assistOS.space.id, this.id, id, image);
        } else {
            await galleryModule.updateMidjourneyHistoryImage(assistOS.space.id, this.id, id, image);
        }
        _target.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${_target.offsetWidth / 2}"></confirmation-popup>`);
    }

    async saveImageToDevice(_target) {
        const link = document.createElement('a');
        link.href = await this.getImageSrc(_target);
        link.download = 'downloaded_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async changeLLMHandler(input, event) {
        let modelName = input.value;
        let newModel = this.models.find((model) => model.name === modelName);
        if (newModel.size && this.currentModel.size) {
            let sizeInput = this.element.querySelector(".select-size");
            let sizeOptions = "";
            for (let size of newModel.size) {
                sizeOptions += `<option value="${size}">${size}</option>`;
            }
            sizeInput.innerHTML = sizeOptions;
            this.galleryConfig.openAIConfig.size = newModel.size[0];
        }
        this.galleryConfig.commonConfig.modelName = newModel.name;
        if (newModel.companyName === this.currentModel.companyName) {
            await galleryModule.updateGalleryConfig(assistOS.space.id, this.id, this.galleryConfig);
        } else {
            this.galleryConfig.mode = newModel.companyName;
            await galleryModule.updateGalleryConfig(assistOS.space.id, this.id, this.galleryConfig);
            this.invalidate(this.refreshHistory);
        }
        this.currentModel = newModel;
    }

    async saveInput(input, event) {
        let type = input.getAttribute("name");
        let value = input.value;
        if (input.hasAttribute("data-is-common-config")) {
            this.galleryConfig.commonConfig[type] = value;
        } else {
            this.galleryConfig.openAIConfig[type] = value;
        }
        await galleryModule.updateGalleryConfig(assistOS.space.id, this.id, this.galleryConfig);
    }

    async savePrompt(promptInput) {
        if (this.galleryConfig.commonConfig.prompt !== promptInput.value) {
            this.galleryConfig.commonConfig.prompt = promptInput.value;
            await galleryModule.updateGalleryConfig(assistOS.space.id, this.id, this.galleryConfig);
        }
    }

    afterRender() {
        let modelInput = this.element.querySelector(".select-llm");
        modelInput.addEventListener("change", this.changeLLMHandler.bind(this, modelInput));
        let inputs = this.element.querySelectorAll(".config-select");
        for (let input of inputs) {
            input.addEventListener("change", this.saveInput.bind(this, input));
        }
        let promptInput = this.element.querySelector("#prompt");
        promptInput.innerHTML = this.galleryConfig.commonConfig.prompt;
        promptInput.addEventListener("click", ()=>{
            let timer = new executorTimer(this.savePrompt.bind(this, promptInput), 3000);
            promptInput.addEventListener("keydown", async (event) => {
                await timer.reset(3000);
            });
            promptInput.addEventListener("blur", async (event) => {
                await timer.stop(true);
            });
        });

        if (this.galleryConfig.mode === "OpenAI") {
            this.selectSavedInputs(this.galleryConfig.openAIConfig);
        }
        this.selectSavedInputs(this.galleryConfig.commonConfig);
        let imageItems = this.element.querySelectorAll(".image-item");
        for (let imageItem of imageItems) {
            let imageCheckbox = imageItem.querySelector(".image-checkbox");
            let imageMenu = imageItem.querySelector(".image-menu");
            imageItem.addEventListener("mouseenter", (event) => {
                imageCheckbox.style.visibility = "visible";
            });
            imageItem.addEventListener("mouseleave", (event) => {
                if (!imageCheckbox.checked) {
                    imageCheckbox.style.visibility = "hidden";
                }
            });
            imageCheckbox.addEventListener("change", (event) => {
                if (imageCheckbox.checked) {
                    imageMenu.style.visibility = "visible";
                } else {
                    imageMenu.style.visibility = "hidden";
                }
            });
        }
    }

    selectSavedInputs(object) {
        for (let key of Object.keys(object)) {
            if(key === "prompt") {
                continue;
            }
            let value = object[key];
            let optionElement = this.element.querySelector(`[value="${value}"]`);
            if (optionElement) {
                optionElement.selected = true;
            }
        }
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async generateImage(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if (!formData.isValid) {
            return;
        }
        let loaderId = assistOS.UI.showLoading();
        this.prompt = formData.data.prompt;
        let flowContext = {
            spaceId: assistOS.space.id,
            prompt: formData.data.prompt,
            modelName: formData.data.modelName
        }
        for (let configName of Object.keys(this.currentModel)) {
            if (configName === "name" || configName === "type") {
                continue;
            }
            flowContext[configName] = formData.data[configName];
        }
        if (this.galleryConfig.mode === "OpenAI") {
            try {
                let imagesMetadata = (await assistOS.callFlow("GenerateImage", flowContext, formData.data.personality)).data;
                await galleryModule.addOpenAIHistoryImages(assistOS.space.id, this.id, imagesMetadata);
                this.invalidate(this.refreshHistory);
            } catch (e) {
                let message = assistOS.UI.sanitize(e.message);
                await showApplicationError(message, message, message);
            }
        } else {
            try {
                let imageMetadata = (await assistOS.callFlow("GenerateImage", flowContext, formData.data.personality)).data;
                await galleryModule.addMidjourneyHistoryImage(assistOS.space.id, this.id, imageMetadata);
                this.invalidate(this.refreshHistory);
            } catch (e) {
                let message = assistOS.UI.sanitize(e.message);
                await showApplicationError(message, message, message);
            }
        }
        assistOS.UI.hideLoading(loaderId);
    }

    async editImage(_target, messageId, action) {
        let loaderId =  assistOS.UI.showLoading();
        try {
            let imageMetadata = await llmModule.editImage(assistOS.space.id, this.currentModel.name, {
                messageId: messageId,
                action: action
            });
            await galleryModule.addMidjourneyHistoryImage(assistOS.space.id, this.id, imageMetadata);
            assistOS.UI.hideLoading(loaderId);
            this.invalidate(this.refreshHistory);
        } catch (e) {
            let message = assistOS.UI.sanitize(e);
            await showApplicationError(message, message, message);
        }
    }

    async openGalleryPage(_target) {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/gallery-page/${this.id}`);
    }
}
