import {executorTimer} from "../../../../imports.js";

const galleryModule = require("assistos").loadModule("gallery", {});
const constants = require("assistos").constants;
const llmModule = require("assistos").loadModule("llm", {});
const utilModule = require("assistos").loadModule("util", {});

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

        utilModule.subscribeToObject(this.id + "/config", async (data) => {
            let galleryConfig = await galleryModule.getGalleryConfig(assistOS.space.id, this.id);
            if (this.galleryConfig !== galleryConfig) {
                this.galleryConfig = galleryConfig;
                this.invalidate(this.refreshHistory);
            }
        });
        utilModule.subscribeToObject(this.id, async (data) => {
            this.invalidate(this.refreshHistory);
        });
        this.selectInputs = [];
    }

    openAIBeforeRender() {
        let imagesHTML = "";
        for (let image of this.images) {
            imagesHTML += `<div class="image-item">
                                    <div class="image-menu">
                                        <button class="general-button small" data-local-action="saveImage">Save</button>
                                        <button class="general-button small" data-local-action="saveImageToDevice">Save to my device</button>
                                        <button class="general-button small">History</button>
                                    </div>
                                    <img src="${image}" class="generated-image" alt="img">
                                    <input type="checkbox" class="image-checkbox">
                                </div>`;
        }
        this.imagesSection = `
            <div class="images-section">
                ${imagesHTML}
            </div>`;
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
            imagesHTML += `<midjourney-image data-id="${image.id}" data-presenter="midjourney-image"></midjourney-image>`;
        }
        this.imagesSection = `
        <div class="midjourney-images-section">
            ${imagesHTML}
        </div>`;
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

    async afterUnload() {
        await utilModule.unsubscribeFromObject(this.id);
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

    async saveImage(_target) {
        let imgSource = await this.getImageSrc(_target);
        await galleryModule.addImage(assistOS.space.id, this.id, {
            src: imgSource,
            userId: assistOS.user.id,
            timestamp: new Date().getTime(),
            prompt: this.prompt || ""
        });
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
        if (newModel.companyName === this.currentModel.companyName) {
            this.galleryConfig.commonConfig.modelName = newModel.name;
            await galleryModule.updateGalleryConfig(assistOS.space.id, this.id, this.galleryConfig);
        } else {
            this.galleryConfig.mode = newModel.companyName;
            this.galleryConfig.commonConfig.modelName = newModel.name;
            await galleryModule.updateGalleryConfig(assistOS.space.id, this.id, this.galleryConfig);
        }
        this.currentModel = newModel;
        this.invalidate();
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
        let loaderId = await assistOS.UI.showLoading();
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
                let images = (await assistOS.callFlow("GenerateImage", flowContext, formData.data.personality)).data;
                let pngPrefix = "data:image/png;base64,"
                for (let i = 0; i < images.length; i++) {
                    images[i] = pngPrefix + images[i];
                }
                this.images = images;
            } catch (e) {
                let message = assistOS.UI.sanitize(e.message);
                await showApplicationError(message, message, message);
            }

        } else {
            try {
                let taskId = await galleryModule.addMidjourneyHistoryImage(assistOS.space.id, this.id, {});
                // flowContext.saveDataConfig = {
                //     module: "gallery",
                //     fnName: "updateImageInHistory",
                //     params: [assistOS.space.id, this.id, taskId]
                // }
                // let task = (await assistOS.callFlow("GenerateImage", flowContext, formData.data.personality)).data;
                // await galleryModule.updateImageInHistory(assistOS.space.id, this.id, taskId, task);
                //task.prompt = this.prompt;
                //task.buttons = ["Cancel Job"];
                //this.images.push(task);
            } catch (e) {
                let message = assistOS.UI.sanitize(e.message);
                await showApplicationError(message, message, message);
            }
        }
        assistOS.UI.hideLoading(loaderId);
        //this.invalidate();
    }

    async editImage(_target, messageId, imageId, action) {
        let loaderId = await assistOS.UI.showLoading();
        try {
            let task = await llmModule.editImage(assistOS.space.id, this.currentModel.name, {
                messageId: messageId,
                action: action,
                saveDataConfig: {
                    module: "gallery",
                    fnName: "updateImageInHistory",
                    params: [assistOS.space.id, this.id, imageId]
                }
            });
            task.prompt = this.prompt;
            task.buttons = ["Cancel Job"];
            this.images.push(task);
            assistOS.UI.hideLoading(loaderId);
            this.invalidate();
        } catch (e) {
            let message = assistOS.UI.sanitize(e);
            await showApplicationError(message, message, message);
        }
    }

    async openGalleryPage(_target) {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/gallery-page/${this.id}`);
    }
}