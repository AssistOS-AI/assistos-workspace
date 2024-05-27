const spaceModule = require("assistos").loadModule("space", {});
const constants = require("assistos").constants;
export class GenerateImagePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.id = window.location.hash.split("/")[3];
        this.invalidate(async () => {
            this.personalities = await assistOS.space.getPersonalitiesMetadata();
        });
        this.images = [];
    }

    beforeRender() {
        let personalitiesHTML = `<option selected value="${constants.PERSONALITIES.DEFAULT_PERSONALITY_ID}">${constants.PERSONALITIES.DEFAULT_PERSONALITY_NAME}</option>`;
        for (let personality of this.personalities) {
            if(personality.id !== constants.PERSONALITIES.DEFAULT_PERSONALITY_ID){
                personalitiesHTML += `<option value="${personality.id}">${personality.name}</option>`;
            }
        }
        this.personalitiesHTML = personalitiesHTML;
        this.imagesHTML = "";
        // this.images = ["https://www.redfin.com/blog/wp-content/uploads/2021/07/Kitty1.jpg",
        //     "https://www.redfin.com/blog/wp-content/uploads/2021/07/Kitty1.jpg",
        //     "https://www.redfin.com/blog/wp-content/uploads/2021/07/Kitty1.jpg"]
        let pngPrefix = "data:image/png;base64,"
        for (let image of this.images) {
            this.imagesHTML += `<div class="image-unit">
                                    <div class="image-menu">
                                        <button class="general-button small" data-local-action="saveImage">Save</button>
                                        <button class="general-button small" data-local-action="saveImageToDevice">Save to my device</button>
                                        <button class="general-button small">History</button>
                                    </div>
                                    <img src="${pngPrefix}${image}" class="generated-image" alt="img">
                                    <input type="checkbox" class="image-checkbox">
                                </div>`;
        }
    }

    getImageSrc(_target) {
        let imageUnit = _target.closest(".image-unit");
        let image = imageUnit.querySelector("img");
        return image.src;
    }

    async saveImage(_target) {
        let imgSource = this.getImageSrc(_target);
        await spaceModule.addImage(assistOS.space.id, this.id, {
            src: imgSource,
            userId: assistOS.user.id,
            timestamp: new Date().getTime(),
            prompt: this.prompt || ""
        });
        _target.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${_target.offsetWidth/2}"></confirmation-popup>`);
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
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async generateImage(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        let loaderId = assistOS.UI.showLoading();
        this.prompt = formData.data.prompt;
        this.images = await assistOS.callFlow("GenerateImage", {
            spaceId: assistOS.space.id,
            prompt: formData.data.prompt,
            variants: formData.data.variants
        }, formData.data.personality);
        assistOS.UI.hideLoading(loaderId);
        this.invalidate();
    }

    async openGalleryPage(_target) {
        await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/Space/gallery-page/${this.id}`);
    }
}