const spaceModule = require("assistos").loadModule("space", {});

export class InsertAudioModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.element.classList.add("maintain-focus");
        this.invalidate();
    }

    beforeRender() {

    }

    closeModal(_target) {
        if(this.audioElement){
            this.audioElement.remove();
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

    async selectFileHandler(_target, event) {
        let file = event.target.files[0];
        let reader = new FileReader();
        this.audioElement = document.createElement('audio');
        let audioId;
        reader.onload = async (e) => {
            const uint8Array = new Uint8Array(e.target.result);
            audioId = await spaceModule.putAudio(assistOS.space.id, uint8Array);
            this.audioElement.addEventListener("loadedmetadata", async () => {
                const duration = this.audioElement.duration;
                await assistOS.loadifyComponent(this.element, async () => {
                    let data = {
                        id: audioId,
                        duration: duration
                    };
                    this.audioElement.remove();
                    URL.revokeObjectURL(this.audioElement.src);
                    assistOS.UI.closeModal(_target, data);
                });
            });
            this.audioElement.src = URL.createObjectURL(file);
        }
        reader.readAsArrayBuffer(file);
    }
}
