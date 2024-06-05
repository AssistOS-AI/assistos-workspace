const spaceModule = require("assistos").loadModule("space", {});
const constants = require("assistos").constants;
const llmModule = require("assistos").loadModule("llm", {});

export class GenerateImagePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.id = window.location.hash.split("/")[3];
        this.invalidate(async () => {
            this.personalities = await assistOS.space.getPersonalitiesMetadata();
            this.models = [];
            let configs = await llmModule.getLLMConfigs(assistOS.space.id);
            for (let companyObj of configs) {
                for (let model of companyObj.models) {
                    if (model.type === "image") {
                        this.models.push(model);
                    }
                }
            }
            this.currentModel = this.models[0];
        });
        this.selectInputs = [];
        this.images = [];
    }

    beforeRender() {
        let personalitiesHTML = `<option selected value="${constants.PERSONALITIES.DEFAULT_PERSONALITY_ID}">${constants.PERSONALITIES.DEFAULT_PERSONALITY_NAME}</option>`;
        for (let personality of this.personalities) {
            if (personality.id !== constants.PERSONALITIES.DEFAULT_PERSONALITY_ID) {
                personalitiesHTML += `<option value="${personality.id}">${personality.name}</option>`;
            }
        }
        this.variantsSelect = "";
        this.sizeSelect = "";
        this.styleSelect = "";
        this.qualitySelect = "";
        this.personalitiesHTML = personalitiesHTML;
        this.imagesHTML = "";
        for (let image of this.images) {
            this.imagesHTML += `<div class="image-unit">
                                    <div class="image-menu">
                                        <button class="general-button small" data-local-action="saveImage">Save</button>
                                        <button class="general-button small" data-local-action="saveImageToDevice">Save to my device</button>
                                        <button class="general-button small">History</button>
                                    </div>
                                    <img src="${image}" class="generated-image" alt="img">
                                    <input type="checkbox" class="image-checkbox">
                                </div>`;
        }
        this.llms = "";
        for (let model of this.models) {
            this.llms += `<option value="${model.name}">${model.name}</option>`;
        }
        if(this.currentModel.variants){
            let variantsHTML = "";
            for (let i= 1; i<= this.currentModel.variants; i++) {
                variantsHTML += `<option value="${i}">${i}</option>`;
            }
            this.variantsSelect = `
            <div class="select-container">
                <label class="form-label" for="variants">Variants</label>
                <select class="select-variants" id="variants" data-id="variants" name="variants">
                    ${variantsHTML}
                </select>
            </div>`;
        }

        if (this.currentModel.size) {
            let sizesHTML = "";
            for (let size of this.currentModel.size) {
                sizesHTML += `<option value="${size}">${size}</option>`;
            }
            this.sizeSelect = `
            <div class="select-container">
                <label class="form-label" for="size">Select Size</label>
                <select class="select-size" id="size" data-id="size" name="size">
                     ${sizesHTML}
                </select>
            </div>`;
        }
        if (this.currentModel.style) {
            let stylesHTML = "";
            for (let style of this.currentModel.style) {
                stylesHTML += `<option value="${style}">${style}</option>`;
            }
            this.styleSelect = `
            <div class="select-container">
                <label class="form-label" for="style">Select Style</label>
                <select class="select-style" id="style" data-id="style" name="style">
                    ${stylesHTML}
                </select>
            </div>`;
        }
        if (this.currentModel.quality) {
            let qualityHTML = "";
            for (let quality of this.currentModel.quality) {
                qualityHTML += `<option value="${quality}">${quality}</option>`;
            }
            this.qualitySelect = `
            <div class="select-container">
                <label class="form-label" for="quality">Select Quality</label>
                <select class="select-quality" id="quality" data-id="quality" name="quality">
                    ${qualityHTML}
                </select>
            </div>`;
        }
    }

    async getImageSrc(_target) {
        let imageUnit = _target.closest(".image-unit");
        let image = imageUnit.querySelector("img");
        const pattern = /^http/;
        if(pattern.test(image.src))
        {
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
        await spaceModule.addImage(assistOS.space.id, this.id, {
            src: imgSource,
            userId: assistOS.user.id,
            timestamp: new Date().getTime(),
            prompt: this.prompt || ""
        });
        _target.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${_target.offsetWidth / 2}"></confirmation-popup>`);
    }

    saveImageToDevice(_target) {
        const link = document.createElement('a');
        link.href = this.getImageSrc(_target);
        link.download = 'downloaded_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    afterRender() {
        let imageUnits = this.element.querySelectorAll(".image-unit");
        for (let imageUnit of imageUnits) {
            let imageCheckbox = imageUnit.querySelector(".image-checkbox");
            let imageMenu = imageUnit.querySelector(".image-menu");
            imageUnit.addEventListener("mouseenter", (event) => {
                imageCheckbox.style.visibility = "visible";
            });
            imageUnit.addEventListener("mouseleave", (event) => {
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
        let modelInput = this.element.querySelector(".select-llm");
        modelInput.addEventListener("change", async (event) => {
            let modelName = modelInput.value;
            let newModel = this.models.find((model) => model.name === modelName);
            if(newModel.size && this.currentModel.size){
                let sizeInput = this.element.querySelector(".select-size");
                let sizeOptions = "";
                for(let size of newModel.size){
                    sizeOptions += `<option value="${size}">${size}</option>`;
                }
                sizeInput.innerHTML = sizeOptions;
            }
            this.currentModel = newModel;
            await this.rememberValues();
            this.invalidate();
        });
        if(this.prompt){
            let promptInput = this.element.querySelector("#prompt");
            promptInput.value = this.prompt;
        }
        for(let value of this.selectInputs){
            let optionElement = this.element.querySelector(`[value="${value}"]`);
            if(optionElement){
                optionElement.selected = true;
            }
        }
        if(this.image){
            this.renderImageButtons();
        }
    }
    async rememberValues() {
        this.selectInputs = [];
        let formData = await assistOS.UI.extractFormInformation(this.element.querySelector("form"));
        this.prompt = formData.data.prompt;
        let formSelects = this.element.querySelectorAll("select");
        for(let selectElement of formSelects){
            this.selectInputs.push(selectElement.value);
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
        for(let configName of Object.keys(this.currentModel)){
            if(configName === "name" || configName === "type"){
                continue;
            }
            flowContext[configName] = formData.data[configName];
        }
        if(this.currentModel.variants){
            this.images = await assistOS.callFlow("GenerateImage", flowContext, formData.data.personality);
            let pngPrefix = "data:image/png;base64,"
            for(let img of this.images){
                img = pngPrefix + img;
            }
        } else if(this.currentModel.buttons){
            //this.image = await assistOS.callFlow("GenerateImage", flowContext, formData.data.personality);
            this.image = {"prompt":"a black cat",
                "status":"DONE",
                "uri":"https://image.mymidjourney.ai/storage/v1/object/public/cdn/9cfaecff-2a16-4666-ae8d-2e5086b33b87.png",
                "progress":100,
                "buttons":["U1","U2","U3","U4","🔄","V1","V2","V3","V4"],
                "messageId":"1f373462-9b80-4840-9165-4812a1db061b",
                "createdAt":"2024-06-04T08:09:30+00:00",
                "updatedAt":"2024-06-04T08:10:06+00:00"};
            this.images.push(this.image.uri);
        }
        await this.rememberValues();
        assistOS.UI.hideLoading(loaderId);
        this.invalidate();
    }
    renderImageButtons(){
        let buttonsSectionElement = this.element.querySelector(".buttons-section");
        if(buttonsSectionElement){
            buttonsSectionElement.remove();
        }
        let buttonsHTML = "";
        for(let action of this.image.buttons){
            buttonsHTML += `<button class="general-button" data-local-action="editImage ${action}">${this.currentModel.buttons[action]}</button>`
        }
        let buttonsSection = `<div class="buttons-section">${buttonsHTML}</div>`;
        let generateImgBtn = this.element.querySelector(".generate-image");
        generateImgBtn.insertAdjacentHTML("beforebegin", buttonsSection);
    }
    async editImage(_target, action){
        let loaderId = await assistOS.UI.showLoading();
        this.image = await llmModule.editImage(assistOS.space.id, this.currentModel.name, {
            messageId: this.image.messageId,
            action: action
        });
        this.images.push(this.image.uri);
        assistOS.UI.hideLoading(loaderId);
        this.invalidate();
    }
    async openGalleryPage(_target) {
        await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/Space/gallery-page/${this.id}`);
    }
}