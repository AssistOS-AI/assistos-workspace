const spaceModule = require("assistos").loadModule("space", {});

export class InsertVideoModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {

    }

    closeModal(_target) {
        this.videoElement.remove();
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

    async selectFileHandler(_target, event) {
        let file = event.target.files[0];
        let reader = new FileReader();
        this.videoElement = document.createElement('video');
        let videoId;
        reader.onload = async (e) => {
            const uint8Array = new Uint8Array(e.target.result);
            videoId = await spaceModule.addVideo(assistOS.space.id, uint8Array);
            this.videoElement.addEventListener("loadedmetadata", async () => {
                const duration = this.videoElement.duration;
                const width = this.videoElement.videoWidth;
                const height = this.videoElement.videoHeight;
                await assistOS.loadifyComponent(this.element, async () => {
                    let data = {
                        id: videoId,
                        width: width,
                        height: height,
                        duration: duration
                    };
                    this.videoElement.remove();
                    URL.revokeObjectURL(this.videoElement.src);
                    assistOS.UI.closeModal(_target, data);
                });
            });
            this.videoElement.src = URL.createObjectURL(file);
        }
        reader.readAsArrayBuffer(file);
    }
}
