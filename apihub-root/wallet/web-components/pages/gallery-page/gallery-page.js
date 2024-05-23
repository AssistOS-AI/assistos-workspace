const spaceModule = require("assistos").loadModule("space", {});
const {notificationService} = require("assistos").loadModule("util", {});

export class GalleryPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.id = window.location.hash.split("/")[3];
        this.refreshGallery = async () => {
            this.gallery = await spaceModule.getGallery(assistOS.space.id, this.id);
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
             stringHTML += `<img class="gallery-image" src="${image.src}" alt="${image.name}">`;
        }
        this.images = stringHTML;
    }

    async openGalleriesPage() {
        await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/Space/galleries-page`);
    }

    afterUnload() {
        spaceModule.unsubscribeFromObject(assistOS.space.id, this.id);
        spaceModule.stopCheckingUpdates(assistOS.space.id);
    }
    generateImage() {
        assistOS.UI.showModal("generate-image-modal");
    }
}