const spaceModule = require("assistos").loadModule("space", {});
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
        let galleryId = await spaceModule.addGallery(assistOS.space.id, {
            name: formData.data.name,
            images: []
        });
        await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/Space/gallery-page/${galleryId}`);
    }
}