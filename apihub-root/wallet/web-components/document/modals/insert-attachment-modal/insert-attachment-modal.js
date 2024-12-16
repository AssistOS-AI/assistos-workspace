const spaceModule = require("assistos").loadModule("space", {});
const galleryModule = require("assistos").loadModule("gallery", {});
import {videoUtils} from "../../../../imports.js";
export class InsertAttachmentModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.element.classList.add("maintain-focus");
        this.element.classList.add("insert-modal");
        this.type = this.element.getAttribute("data-type");
        this.invalidate();
    }

    async beforeRender() {
        if(this.type === "effects" || this.type === "audio") {
            this.accept = "audio/mp3";
            this.fileHandler = this.selectAudioHandler;
        } else if(this.type === "image") {
            this.accept = "image/png";
            this.fileHandler = this.selectImageHandler;
        } else if(this.type === "video") {
            this.accept = "video/mp4";
            this.fileHandler = this.selectVideoHandler;
        }
        this.galleries = await galleryModule.getGalleriesMetadata(assistOS.space.id);
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

    closeModal(_target) {
        if(this.attachmentElement){
            this.attachmentElement.remove();
        }
        assistOS.UI.closeModal(_target);
    }

    openMyDevice(_target) {
        let fileInput = this.element.querySelector("#fileInput");
        fileInput.setAttribute("accept", this.accept);
        fileInput.click();
        if (!this.boundFileHandler) {
            this.boundFileHandler = this.fileHandler.bind(this, _target);
            fileInput.addEventListener("change", this.boundFileHandler);
        }
    }

    async selectAudioHandler(_target, event) {
        let file = event.target.files[0];
        let reader = new FileReader();
        this.attachmentElement = document.createElement('audio');
        reader.onload = async (e) => {
            const uint8Array = new Uint8Array(e.target.result);
            await assistOS.loadifyComponent(this.element, async () => {
                let audioId = await spaceModule.putAudio(uint8Array);
                let data = await this.loadAudioMetadata(file, audioId);
                assistOS.UI.closeModal(_target, data);
            });
        }
        reader.readAsArrayBuffer(file);
    }
    loadAudioMetadata(file, audioId) {
        return new Promise(async (resolve, reject) => {
            this.attachmentElement.addEventListener("loadedmetadata", async () => {
                const duration = parseFloat(this.attachmentElement.duration);
                let data = {
                    id: audioId,
                    duration: duration,
                    volume: 100
                };
                if(this.type === "effects") {
                    data.start = 0;
                    data.end = duration;
                    data.name = file.name.replace(/\s+/g, "_");
                    data.playAt = 0;
                }
                this.attachmentElement.remove();
                URL.revokeObjectURL(this.attachmentElement.src);
                resolve(data);
            });
            this.attachmentElement.src = URL.createObjectURL(file);
        });
    }

    async selectVideoHandler(modal, event) {
        let file = event.target.files[0];
        let reader = new FileReader();
        this.attachmentElement = document.createElement('video');
        this.attachmentElement.preload = "metadata";
        let videoId;
        reader.onload = async (e) => {
            await assistOS.loadifyComponent(this.element, async () => {
                const uint8Array = new Uint8Array(e.target.result);
                videoId = await spaceModule.putVideo(uint8Array);
                let videoURL = URL.createObjectURL(file);
                let thumbnailId = await videoUtils.uploadVideoThumbnail(videoURL, this.attachmentElement);
                const duration = parseFloat(this.attachmentElement.duration);
                const width = this.attachmentElement.videoWidth;
                const height = this.attachmentElement.videoHeight;
                let data = {
                    id: videoId,
                    thumbnailId: thumbnailId,
                    width: width,
                    height: height,
                    duration: duration,
                    start: 0,
                    end: duration,
                    volume: 100
                };
                this.attachmentElement.remove();
                URL.revokeObjectURL(videoURL);
                assistOS.UI.closeModal(modal, data);
            });
        }
        reader.readAsArrayBuffer(file);
    }

    selectImageHandler(modal, event) {
        let file = event.target.files[0];
        let reader = new FileReader();
        this.attachmentElement = new Image();
        reader.onload = async (e) => {
            const uint8Array = new Uint8Array(e.target.result);
            let imageId = await spaceModule.putImage(uint8Array);
            reader.onload = async (e) => {
                this.attachmentElement.onload = async () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = this.attachmentElement.width;
                    canvas.height = this.attachmentElement.height;
                    ctx.drawImage(this.attachmentElement, 0, 0);
                    canvas.remove();
                    await assistOS.loadifyComponent(this.element, async () => {
                        const width = this.attachmentElement.width;
                        const height = this.attachmentElement.height;
                        let data = {
                            id: imageId,
                            width: width,
                            height: height
                        };
                        assistOS.UI.closeModal(modal, data);
                    });
                };
                this.attachmentElement.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
        reader.readAsArrayBuffer(file);
    }
    openGallerySection() {
        let modalBody = this.element.querySelector(".modal-body");
        modalBody.remove();
        this.modalBody = this.gallerySection;
        this.element.insertAdjacentHTML('beforeend', this.modalBody);
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
        let modalBody = this.element.querySelector(".modal-body");
        modalBody.remove();
        this.element.insertAdjacentHTML('beforeend', this.modalBody);
    }
    insertImages(_target) {
        assistOS.UI.closeModal(_target, this.selectedImage);
    }
}
