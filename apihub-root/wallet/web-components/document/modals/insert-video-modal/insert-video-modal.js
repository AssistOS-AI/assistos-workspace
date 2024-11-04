const spaceModule = require("assistos").loadModule("space", {});

export class InsertVideoModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.element.classList.add("maintain-focus");
        this.element.classList.add("insert-modal");
        this.invalidate();
    }

    beforeRender() {

    }

    closeModal(_target) {
        if(this.videoElement){
            this.videoElement.remove();
        }

        assistOS.UI.closeModal(_target);
    }

    openMyDevice(_target) {
        let fileInput = this.element.querySelector("#fileInput");
        fileInput.click();
        if (!this.boundFileHandler) {
            this.boundFileHandler = this.selectFileHandler.bind(this, _target);
            fileInput.addEventListener("change", this.boundFileHandler);
        }
    }

    async selectFileHandler(modal, event) {
        let file = event.target.files[0];
        let reader = new FileReader();
        this.videoElement = document.createElement('video');
        this.videoElement.preload = "metadata";
        let videoId;
        reader.onload = async (e) => {
            await assistOS.loadifyComponent(this.element, async () => {
                const uint8Array = new Uint8Array(e.target.result);
                videoId = await spaceModule.putVideo(uint8Array);
                let thumbnailId = await this.uploadVideoThumbnail(file);
                const duration = parseFloat(this.videoElement.duration.toFixed(1));
                const width = this.videoElement.videoWidth;
                const height = this.videoElement.videoHeight;
                let data = {
                    id: videoId,
                    thumbnailId: thumbnailId,
                    width: width,
                    height: height,
                    duration: duration,
                    start: 0,
                    end: duration
                };
                this.videoElement.remove();
                URL.revokeObjectURL(this.videoElement.src);
                assistOS.UI.closeModal(modal, data);
            });
        }
        reader.readAsArrayBuffer(file);
    }
    canvasToBlobAsync(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas to Blob conversion failed.'));
                }
            });
        });
    }
    uploadVideoThumbnail(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            this.videoElement.addEventListener("loadedmetadata", async () => {
                this.videoElement.currentTime = 0;
            });
            this.videoElement.addEventListener('seeked', async () => {
                canvas.width = this.videoElement.videoWidth;
                canvas.height = this.videoElement.videoHeight;
                context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
                try {
                    let blob = await this.canvasToBlobAsync(canvas);
                    canvas.remove();
                    let arrayBuffer = await blob.arrayBuffer();
                    let thumbnailId = await spaceModule.putImage(arrayBuffer);
                    resolve(thumbnailId);
                } catch (e) {
                    reject(e);
                }

            }, {once: true});
            this.videoElement.src = URL.createObjectURL(file);
        });
    }
}
