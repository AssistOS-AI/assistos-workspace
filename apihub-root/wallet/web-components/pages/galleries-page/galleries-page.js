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
        this.actionBox = await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async addGallery(){
        await assistOS.UI.showModal("add-gallery-modal");
    }
    renameGallery(_target) {
        let component = assistOS.UI.reverseQuerySelector(_target, "gallery-unit");
        let galleryName = component.querySelector(".gallery-name-text");
        let galleryId = component.getAttribute("data-id");
        if(this.actionBox){
            assistOS.UI.removeActionBox(this.actionBox, this);
        }
        if (galleryName.getAttribute("contenteditable") === "false") {
            component.removeAttribute("data-local-action");
            galleryName.setAttribute("contenteditable", "true");
            galleryName.focus();
            let controller = new AbortController();
            galleryName.addEventListener("blur", async (event) => {
                component.setAttribute("data-local-action", `openGallery ${galleryId}`);
                galleryName.setAttribute("contenteditable", "false");
                await spaceModule.updateGalleryName(assistOS.space.id, galleryId, galleryName.innerText);
                controller.abort();
            }, {signal: controller.signal});
        }

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