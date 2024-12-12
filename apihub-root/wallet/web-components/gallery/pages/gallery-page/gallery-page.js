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
            this.boundsOnGalleryUpdate = this.onGalleryUpdate.bind(this);
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, this.id, this.boundsOnGalleryUpdate);
        });
    }
    onGalleryUpdate(data){
        if(data === "delete"){
            return this.invalidate(async () => {
                await this.openGalleriesPage();
                alert("The gallery has been deleted");
            });
        }
        this.invalidate(async () => {
            await this.refreshGallery();
        });
    }

    beforeRender() {
        this.galleryName = this.gallery.config.name;
        let stringHTML = "";
        let allImages = this.gallery.openAIHistory.concat(this.gallery.midjourneyHistory);
        allImages.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        for(let image of allImages){
            if(image.saved){
                stringHTML += `<img class="gallery-image" src="${image.src}" alt="${image.createdAt}">`;
            }
        }
        this.images = stringHTML;
    }

    async openGalleriesPage() {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/galleries-page`);
    }
    async generateImage() {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/generate-image-page/${this.id}`);
    }
}
