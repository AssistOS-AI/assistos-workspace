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
    selectFileHandler(_target, event){
        let file = event.target.files[0];

        const videoElement = document.createElement('video');
        videoElement.onloadedmetadata = async function() {
            const duration = videoElement.duration;
            const width = videoElement.videoWidth;
            const height = videoElement.videoHeight;
            let formData = new FormData();
            formData.append('videoFile', file);
            let videoId = await spaceModule.addVideo(assistOS.space.id, formData);

            let data = {
                id: videoId,
                width: width,
                height: height,
                duration: duration
            };
            assistOS.UI.closeModal(_target, data);
        };
        videoElement.src = URL.createObjectURL(file);
    }
}