export class GenerateImageModal{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.images = [];
    }
    beforeRender(){
        this.imagesHTML = "";
        // this.images = ["https://www.redfin.com/blog/wp-content/uploads/2021/07/Kitty1.jpg",
        // "https://www.redfin.com/blog/wp-content/uploads/2021/07/Kitty1.jpg",
        // "https://www.redfin.com/blog/wp-content/uploads/2021/07/Kitty1.jpg",
        // "https://www.redfin.com/blog/wp-content/uploads/2021/07/Kitty1.jpg",
        // "https://www.redfin.com/blog/wp-content/uploads/2021/07/Kitty1.jpg"]
        for(let image of this.images){
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
    }
    saveImage(_target){

    }
    saveImageToDevice(_target){

    }
    afterRender(){
        let imageUnits = this.element.querySelectorAll(".image-unit");
        for(let imageUnit of imageUnits){
            let imageCheckbox = imageUnit.querySelector(".image-checkbox");
            let imageMenu = imageUnit.querySelector(".image-menu");
            imageUnit.addEventListener("mouseenter", (event) => {
                imageCheckbox.style.visibility = "visible";
            });
            imageUnit.addEventListener("mouseleave", (event) => {
                if(!imageCheckbox.checked){
                    imageCheckbox.style.visibility = "hidden";
                }
            });
            imageCheckbox.addEventListener("change", (event) => {
                if(imageCheckbox.checked){
                    imageMenu.style.visibility = "visible";
                }else{
                    imageMenu.style.visibility = "hidden";
                }
            });
        }
    }
    closeModal(_target){
        assistOS.UI.closeModal(_target);
    }
    async generateImage(_target){
        let formData = await assistOS.UI.extractFormInformation(_target);
        let loaderId = assistOS.UI.showLoading();
        this.images = await assistOS.callFlow("GenerateImage", {
            spaceId: assistOS.space.id,
            prompt: formData.data.prompt,
            variants: formData.data.variants
        });
        assistOS.UI.hideLoading(loaderId);
        this.invalidate();
    }
}