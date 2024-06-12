const spaceModule = require("assistos").loadModule("space", {});
export class ImageUnit{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let imageId = this.element.getAttribute("data-id");
        this.galleryId = this.element.getAttribute("data-gallery-id");
        this.invalidate(async ()=>{
            this.image = await spaceModule.getImage(assistOS.space.id, this.galleryId, imageId);
            const blobImg = assistOS.services.base64ToBlob(this.image.src, 'image/png');
            this.imgURl = URL.createObjectURL(blobImg);
        });
    }
    beforeRender() {
        this.imgSrc = this.imgURl;
        this.imgAlt = this.image.prompt;
    }
    afterRender(){
    }
    afterUnload(){
        URL.revokeObjectURL(this.imgURl);
    }
}