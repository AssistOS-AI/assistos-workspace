export class DocumentVideoPreview{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        let parentPresenter = this.element.closest("document-view-page").webSkelPresenter;
        this.document = parentPresenter._document;
    }
    beforeRender() {
    }
    showControls(){
        let controls = this.element.querySelector(".controls-mask");
        controls.style.display = "flex";
    }
    hideControls(){
        let controls = this.element.querySelector(".controls-mask");
        controls.style.display = "none";
    }
    afterRender(){
        let imageContainer = this.element.querySelector(".image-container");
        if(!this.boundShowControls){
            this.boundShowControls = this.showControls.bind(this);
            this.boundHideControls = this.hideControls.bind(this);
            imageContainer.addEventListener("mouseover", this.boundShowControls);
            imageContainer.addEventListener("mouseout", this.boundHideControls);
        }
        this.audioPlayer = this.element.querySelector(".audio-player");
        this.imagetTag = this.element.querySelector(".current-image");
        if(!this.boundPlayNextAudio){
            this.boundPlayNextAudio = this.playNextAudio.bind(this);
            this.audioPlayer.addEventListener("ended", this.boundPlayNextAudio);
        }
        this.chapter = this.document.chapters[0];
        this.paragraph = this.chapter.paragraphs[0];
        this.playNextAudio();
    }
    closePlayer(){
        this.element.remove();
    }
    playPause(targetElement){
        let mode = targetElement.getAttribute("data-mode");
        let imgTag;
        if(mode === "pause" || mode === "reload"){
            imgTag = `<img class="pointer" src="./wallet/assets/icons/pause.svg" alt="pause">`;
            this.audioPlayer.play();
            mode = "play";
        } else if(mode === "play"){
            imgTag = `<img class="pointer" src="./wallet/assets/icons/play.svg" alt="play">`;
            this.audioPlayer.pause();
            mode = "pause";
        }
        targetElement.innerHTML = imgTag;
        targetElement.setAttribute("data-mode", mode);
    }
    playNextAudio(){
        let currentChapterIndex = this.document.chapters.indexOf(this.chapter);
        let currentParagraphIndex = this.chapter.paragraphs.indexOf(this.paragraph);
        for(let i = currentChapterIndex; i < this.document.chapters.length; i++){
            let chapter = this.document.chapters[i];
            for(let j = currentParagraphIndex + 1; j < chapter.paragraphs.length; j++){
                let paragraph = chapter.paragraphs[j];
                if(paragraph.image) {
                    this.imagetTag.src = paragraph.image.src;
                    this.chapter = chapter;
                    this.paragraph = paragraph;
                }else if(paragraph.audio) {
                    this.audioPlayer.src = paragraph.audio.src;
                    this.chapter = chapter;
                    this.paragraph = paragraph;
                    this.audioPlayer.load();
                    this.audioPlayer.play();
                    return;
                }
            }
        }
        let playButton = this.element.querySelector(".play-pause");
        playButton.setAttribute("data-mode", "reload");
        playButton.innerHTML = `<img class="pointer" src="./wallet/assets/icons/refresh.svg" alt="refresh">`;
        this.chapter = this.document.chapters[0];
        this.paragraph = this.chapter.paragraphs[0];
    }
}