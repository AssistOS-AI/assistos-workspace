import {base64ToBlob} from "../../../../imports.js";
const galleryModule = require("assistos").loadModule("gallery", {});
export class ImageItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let imageId = this.element.getAttribute("data-id");
        this.galleryId = this.element.getAttribute("data-gallery-id");
        this.invalidate(async ()=>{
            this.image = await galleryModule.getImage(assistOS.space.id, this.galleryId, imageId);
            const blobImg = base64ToBlob(this.image.src, 'image/png');
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