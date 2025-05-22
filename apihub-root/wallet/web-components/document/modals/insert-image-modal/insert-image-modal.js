const galleryModule = assistOS.loadModule("gallery");
const spaceModule = assistOS.loadModule("space");

export class InsertImageModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.modalBody = `
            <div class="modal-body">
                <button data-local-action="openGallerySection">From Gallery</button>
                <button data-local-action="openMyDevice">My device</button data-local-action="openMyDevice">
                <input type="file" id="file" class="hidden" accept="image/*">
            </div>`;
        this.invalidate(async () => {
            this.galleries = await galleryModule.getGalleriesMetadata(assistOS.space.id);
        });
        this.selectedImage = "";
        this.element.classList.add("maintain-focus");
        this.element.classList.add("insert-modal");
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
        if (this.galleries.length > 0) {
            this.galleries.forEach((gallery) => {
                galleriesHMTL += `<gallery-item data-name="${gallery.config.name}" 
                data-id="${gallery.id}" data-local-action="openGallery ${gallery.id}"></gallery-item>`;
            });
        } else {
            galleriesHMTL = `<div> There are no galleries yet </div>`;
        }
        this.gallerySection = `
        <div class="modal-body gallery-section">
         ${galleriesHMTL}
        </div>`;
    }

    afterRender() {
        if (this.modalBody === this.galleryImagesSection) {
            let images = this.element.querySelectorAll(".gallery-image");
            images.forEach((image) => {
                image.addEventListener("click", (event) => {
                    let imgContainer = event.target.parentElement;
                    let imgId = event.target.getAttribute("id");
                    let image = this.allImages.find((img) => img.id === imgId);
                    let checkbox = imgContainer.querySelector(".image-checkbox");
                    event.target.classList.toggle("selected-image");
                    if (imgContainer.classList.contains("selected")) {
                        imgContainer.classList.remove("selected");
                        checkbox.checked = false;
                        checkbox.style.visibility = "hidden";
                        this.selectedImage = "";
                    } else {
                        imgContainer.classList.add("selected");
                        checkbox.checked = true;
                        checkbox.style.visibility = "visible";
                        if (this.selectedImage) {
                            let selectedImgContainer = this.element.querySelector(`#${this.selectedImage.id}`).parentElement;
                            selectedImgContainer.classList.remove("selected");
                            selectedImgContainer.querySelector(".image-checkbox").checked = false;
                            selectedImgContainer.querySelector(".image-checkbox").style.visibility = "hidden";
                        }
                        this.selectedImage = image;
                    }
                });
            });
        }

    }

    openGallerySection() {
        this.modalBody = this.gallerySection;
        this.invalidate();
    }

    closeModal(_target) {
        if(this.imgElement){
            this.imgElement.remove();
        }
        assistOS.UI.closeModal(_target);
    }

    async openGallery(_target, galleryId) {
        this.selectedGallery = await galleryModule.getGallery(assistOS.space.id, galleryId);
        let allImages = this.selectedGallery.openAIHistory.concat(this.selectedGallery.midjourneyHistory);
        allImages.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        this.allImages = allImages.filter((image) => image.saved);
        let stringHTML = "";
        for (let image of this.allImages) {
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

    insertImages(_target) {
        assistOS.UI.closeModal(_target, this.selectedImage);
    }

    openMyDevice(_target) {
        let fileInput = this.element.querySelector("#file");
        fileInput.click();
        if (!this.boundFileHandler) {
            this.boundFileHandler = this.selectFileHandler.bind(this, _target);
            fileInput.addEventListener("change", this.boundFileHandler);
        }
    }

    selectFileHandler(_target, event) {
        let file = event.target.files[0];
        let reader = new FileReader();
        this.imgElement = new Image();
        reader.onload = async (e) => {
            const uint8Array = new Uint8Array(e.target.result);
            let imageId = await spaceModule.putImage(uint8Array);
            reader.onload = async (e) => {
                this.imgElement.onload = async () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = this.imgElement.width;
                    canvas.height = this.imgElement.height;
                    ctx.drawImage(this.imgElement, 0, 0);
                    canvas.remove();
                    await assistOS.loadifyComponent(this.element, async () => {
                        const width = this.imgElement.width;
                        const height = this.imgElement.height;
                        let data = {
                            id: imageId,
                            width: width,
                            height: height
                        };
                        assistOS.UI.closeModal(_target, data);
                    });
                };
                this.imgElement.src = e.target.result;
            };
            reader.readAsDataURL(file);

        }
        reader.readAsArrayBuffer(file);
    }

}

