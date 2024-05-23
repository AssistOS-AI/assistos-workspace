const spaceModule = require("assistos").loadModule("space", {});
const {notificationService} = require("assistos").loadModule("util", {});
export class GalleriesPage{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.refreshGalleries = async ()=>{
            this.galleries = await spaceModule.getGalleriesMetadata(assistOS.space.id);
        }
        this.id = "galleries";
        this.invalidate(async () => {
            await this.refreshGalleries();
            await spaceModule.subscribeToObject(assistOS.space.id, this.id);
            spaceModule.startCheckingUpdates(assistOS.space.id);
        });
        notificationService.on(this.id, ()=>{
            this.invalidate(this.refreshGalleries);
        });
    }
    beforeRender(){
        this.tableRows = "";
        if(this.galleries.length > 0) {
            this.galleries.forEach((gallery) => {
                this.tableRows += `<gallery-unit data-name="${assistOS.UI.sanitize(gallery.name)}" 
                data-id="${gallery.id}" data-local-action="openGallery ${gallery.id}"></gallery-unit>`;
            });
        }
        else {
            this.tableRows = `<div> There are no galleries yet </div>`;
        }
    }
    afterUnload(){
        spaceModule.unsubscribeFromObject(assistOS.space.id, this.id);
        spaceModule.stopCheckingUpdates(assistOS.space.id);
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async addGallery(){
        await assistOS.UI.showModal("add-gallery-modal");
    }
    renameGallery(_target) {
        alert("to be done");
    }
    async deleteGallery(_target){
        let galleryUnit = _target.closest("gallery-unit");
        let galleryId = galleryUnit.getAttribute("data-id");
        await spaceModule.deleteGallery(assistOS.space.id, galleryId);
    }
    async openGallery(_target, galleryId){
        await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/Space/gallery-page/${galleryId}`);
    }
    async downloadGallery(_target, galleryId){
        alert("to be done");
    }
}