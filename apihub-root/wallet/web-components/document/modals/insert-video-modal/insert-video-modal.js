const spaceModule = require("assistos").loadModule("space", {});
export class InsertVideoModal{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){

    }
    closeModal(_target){
        this.videoElement.remove();
        assistOS.UI.closeModal(_target);
    }
    openMyDevice(_target){
        let fileInput = this.element.querySelector("#fileInput");
        fileInput.click();
        if(!this.boundFileHandler){
            this.boundFileHandler = this.selectFileHandler.bind(this, _target);
            fileInput.addEventListener("change", this.boundFileHandler);
        }
    }
    async selectFileHandler(_target, event){
        let file = event.target.files[0];
        this.videoElement = document.createElement('video');
        this.videoElement.src = URL.createObjectURL(file);
        this.videoElement.addEventListener("loadedmetadata", async () => {
            const duration = this.videoElement.duration;
            const width = this.videoElement.videoWidth;
            const height = this.videoElement.videoHeight;
            let formData = new FormData();
            formData.append('videoFile', file);
            await assistOS.loadifyComponent(this.element, async ()=>{
                let videoId = await spaceModule.addVideo(assistOS.space.id, formData);
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


    }
}