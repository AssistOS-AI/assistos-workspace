const spaceModule = require("assistos").loadModule("space", {});
export class InsertImageModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let chapterId = this.element.getAttribute("data-chapter-id");
        this._document = document.querySelector("space-document-view-page").webSkelPresenter._document;
        this.chapter = this._document.getChapter(chapterId);
        this.modalBody = `
            <div class="modal-body">
                <button data-local-action="openGallerySection">From Gallery</button>
                <button data-local-action="openGenerateSection">Generate</button>
            </div>`;
        this.invalidate(async ()=>{
            this.galleries = await spaceModule.getGalleriesMetadata(assistOS.space.id);
        });
        this.selectedImages = [];
    }

    beforeRender() {
        this.generateSection = `
        <form class="modal-body generate-section">
            <div class="form-item">
                <label class="modal-label" for="prompt">Prompt</label>
                <textarea class="form-input" name="prompt" id="prompt" data-id="prompt"></textarea>
            </div>
            <div class="modal-footer">
                <button type="button" class="general-button" data-local-action="changePersonality">Generate image</button>
            </div>
        </form>`;
        let galleriesHMTL = "";
        if(this.galleries.length > 0) {
            this.galleries.forEach((gallery) => {
                galleriesHMTL += `<gallery-unit data-name="${assistOS.UI.sanitize(gallery.name)}" 
                data-id="${gallery.id}" data-local-action="openGallery ${gallery.id}"></gallery-unit>`;
            });
        }
        else {
            galleriesHMTL = `<div> There are no galleries yet </div>`;
        }
        this.gallerySection = `
        <div class="modal-body gallery-section">
         ${galleriesHMTL}
        </div>`;
    }

    afterRender() {
        if(this.modalBody === this.generateSection){
            let input = this.element.querySelector('#prompt');
            let inputValue = "";
            for (let paragraph of this.chapter.paragraphs) {
                inputValue += paragraph.text;
            }
            input.value = inputValue;
        }
        if(this.modalBody === this.galleryImagesSection){
            let images = this.element.querySelectorAll(".gallery-image");
            images.forEach((image) => {
                image.addEventListener("click", (event) => {
                    let imgContainer = event.target.parentElement;
                    let imgId = event.target.getAttribute("id");
                    let image = this.selectedGallery.images.find((img) => img.id === imgId);
                    let checkbox = imgContainer.querySelector(".image-checkbox");
                    event.target.classList.toggle("selected-image");
                    if(imgContainer.classList.contains("selected")){
                        imgContainer.classList.remove("selected");
                        checkbox.checked = false;
                        checkbox.style.visibility = "hidden";
                        this.selectedImages = this.selectedImages.filter((img) => img.id !== image.id);
                    } else {
                        imgContainer.classList.add("selected");
                        checkbox.checked = true;
                        checkbox.style.visibility = "visible";
                        this.selectedImages.push(image);
                    }
                });
            });
        }

    }
    openGenerateSection(){
        this.modalBody = this.generateSection;
        this.invalidate();
    }
    openGallerySection(){
        this.modalBody = this.gallerySection;
        this.invalidate();
    }
    closeModal(_target){
        assistOS.UI.closeModal(_target);
    }
    async openGallery(_target, galleryId){
        this.selectedGallery = await spaceModule.getGallery(assistOS.space.id, galleryId);
        let stringHTML = "";
        for(let image of this.selectedGallery.images){
            stringHTML += `
            <div class="img-container">
                <img class="gallery-image" src="${image.src}" alt="${image.timestamp}" id="${image.id}">
                <input type="checkbox" class="image-checkbox">
            </div>
            `;
        }
        this.galleryImagesSection = `
        <div class="modal-body gallery-images">
            <div class="images-grid">
                 ${stringHTML}
            </div>
            <div class="modal-footer">
                <button type="button" class="general-button" data-local-action="insertImages">Insert</button>
            </div>
        </div>`;
        this.modalBody = this.galleryImagesSection;
        this.invalidate();
    }
    insertImages(_target){
        let data= {
            images: this.selectedImages,
            galleryId: this.selectedGallery.id
        }
        assistOS.UI.closeModal(_target, data);
    }
}