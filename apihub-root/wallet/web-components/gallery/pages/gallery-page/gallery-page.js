const utilModule = require("assistos").loadModule("util", {});
const galleryModule = require("assistos").loadModule("gallery", {});
export class GalleryPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.id = window.location.hash.split("/")[3];
        this.refreshGallery = async () => {
            this.gallery = await galleryModule.getGallery(assistOS.space.id, this.id);
        }
        this.invalidate(async () => {
            await this.refreshGallery();
            await utilModule.subscribeToObject(this.id, (data) => {
                this.invalidate(async () => {
                    await this.refreshGallery();
                });
            });
            await utilModule.subscribeToObject(this.id + "/delete", (data) => {
                this.invalidate(async () => {
                    await this.openGalleriesPage();
                    alert("The gallery has been deleted");
                });
            });
        });
    }

    beforeRender() {
        this.galleryName = this.gallery.name;
        let stringHTML = "";
        for(let image of this.gallery.images){
             stringHTML += `<img class="gallery-image" src="${image.src}" alt="${image.timestamp}">`;
        }
        this.images = stringHTML;
    }

    async openGalleriesPage() {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/galleries-page`);
    }

    async afterUnload() {
       await utilModule.unsubscribeFromObject(this.id);
       await utilModule.unsubscribeFromObject(this.id + "/delete");
    }
    async generateImage() {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/generate-image-page/${this.id}`);
    }
}