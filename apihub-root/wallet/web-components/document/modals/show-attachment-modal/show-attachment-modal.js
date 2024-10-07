const utilModule = require("assistos").loadModule("util", {});
export class ShowAttachmentModal{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.type = this.element.getAttribute('data-type');
        this.id = this.element.getAttribute('data-id');
        document.addEventListener('click', (event) => {
            if(!event.target.closest('show-attachment-modal')){
                this.closeModal();
            }
        });
        this.invalidate();
    }
    beforeRender(){
        if(this.type === 'image'){
            this.downloadFileName = `image-${this.id}.png`;
            this.src = utilModule.constants.getImageSrc(assistOS.space.id, this.id);
            this.modalBodyContent = `
            <img class="image-attachment" src="${this.src}" alt="image">`;
        } else if(this.type === 'audio'){
            this.downloadFileName = `audio-${this.id}.mp3`;
            this.src = utilModule.constants.getAudioSrc(assistOS.space.id, this.id);
            this.modalBodyContent = `<audio class="audio-attachment" src="${this.src}" controls></audio>`;
        } else if(this.type === 'video'){
            this.downloadFileName = `video-${this.id}.mp4`;
            this.src = utilModule.constants.getVideoSrc(assistOS.space.id, this.id);
            this.modalBodyContent = `<video class="video-attachment" src="${this.src}" controls></video>`;
        }
        this.modalBodyContent += `<button class="general-button download-button" data-local-action="downloadAttachment">Download</button>`;
    }
    afterRender() {
        let audioPlayer = this.element.querySelector('.audio-attachment');
        if(audioPlayer){
            audioPlayer.play();
        }
        let videoPlayer = this.element.querySelector('.video-attachment');
        if(videoPlayer){
            videoPlayer.play();
        }
    }
    downloadAttachment(){
        const link = document.createElement('a');
        link.href = this.src;
        link.download = this.downloadFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    async closeModal(){
        await assistOS.UI.closeModal(this.element);
    }
}
