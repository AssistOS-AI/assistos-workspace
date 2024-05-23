export class GenerateImageModal{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){
    }
    closeModal(_target){
        assistOS.UI.closeModal(_target);
    }
    async generateImage(_target){
        let formData = await assistOS.UI.extractFormInformation(_target);
        await assistOS.callFlow("GenerateImage", {
            spaceId: assistOS.space.id,
            prompt: formData.data.prompt,
            variants: formData.data.variants
        })
    }
}