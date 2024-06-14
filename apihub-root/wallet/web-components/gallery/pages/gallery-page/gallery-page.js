const spaceModule = require("assistos").loadModule("space", {});
const {notificationService} = require("assistos").loadModule("util", {});
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
            await spaceModule.subscribeToObject(assistOS.space.id, this.id);
            spaceModule.startCheckingUpdates(assistOS.space.id);
        });
        notificationService.on(this.id, () => {
            this.invalidate(async () => {
                await this.refreshGallery();
            });
        });
        notificationService.on(this.id + "/delete", () => {
            this.invalidate(async () => {
                await this.openGalleriesPage();
                alert("The gallery has been deleted");
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

    afterUnload() {
        spaceModule.unsubscribeFromObject(assistOS.space.id, this.id);
        spaceModule.stopCheckingUpdates(assistOS.space.id);
    }
    async generateImage() {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/generate-image-page/${this.id}`);
    }
}