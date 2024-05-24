export class GenerateImageModal{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.images = [];
    }
    beforeRender(){
        this.imagesHTML = "";
        for(let image of this.images){
            this.imagesHTML += `<img src="${image}" class="generated-image" alt="img">`;
        }
    }
    closeModal(_target){
        assistOS.UI.closeModal(_target);
    }
    async generateImage(_target){
        let formData = await assistOS.UI.extractFormInformation(_target);
        this.images = await assistOS.callFlow("GenerateImage", {
            spaceId: assistOS.space.id,
            prompt: formData.data.prompt,
            variants: formData.data.variants
        });
        this.invalidate();
    }
}