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
            name: formData.data.name,
            images: []
        });
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/gallery-page/${galleryId}`);
    }
}