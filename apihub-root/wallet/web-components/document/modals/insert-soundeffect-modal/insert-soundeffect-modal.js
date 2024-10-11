const spaceModule = require("assistos").loadModule("space", {});

export class InsertSoundEffectModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.element.classList.add("maintain-focus");
        this.invalidate();
    }

    beforeRender() {

    }

    closeModal(_target) {
        this.audioElement?.remove();
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
        const loopAudio = this.element.querySelector("#loop").checked;
        let reader = new FileReader();
        this.audioElement = document.createElement('audio');

        reader.onload = async (e) => {
            const uint8Array = new Uint8Array(e.target.result);
            await assistOS.loadifyComponent(this.element, async () => {
                let audioId = await spaceModule.putAudio(assistOS.space.id, uint8Array);
                let data = await this.loadAudioMetadata(file, loopAudio, audioId);
                assistOS.UI.closeModal(_target, data);
            });
        }
        reader.readAsArrayBuffer(file);
    }
    loadAudioMetadata(file, loopAudio, audioId) {
        return new Promise(async (resolve, reject) => {
            this.audioElement.addEventListener("loadedmetadata", async () => {
                const duration = this.audioElement.duration;
                let data = {
                    id: audioId,
                    duration: duration,
                    loop:loopAudio,
                };
                this.audioElement.remove();
                URL.revokeObjectURL(this.audioElement.src);
                resolve(data);
            });
            this.audioElement.src = URL.createObjectURL(file);
        });
    }
}
