const galleryModule = require("assistos").loadModule("gallery", {});
export class AddGalleryModal{
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
    async addGallery(_target){
        assistOS.UI.closeModal(_target);
        const formData = await assistOS.UI.extractFormInformation(_target);
        let galleryId = await galleryModule.addGallery(assistOS.space.id, {
            config:{
                name: formData.data.name,
                mode: "OpenAI",
                commonConfig:{
                    personalityId: "",
                    modelName: "DALL-E-2",
                    prompt: ""
                },
                openAIConfig: {
                    variants: "1",
                    size: "256x256",
                    style: "natural",
                    quality: "standard"
                }
            },
            midjourneyHistory:[],
            openAIHistory:[],
        });
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/gallery-page/${galleryId}`);
    }
}