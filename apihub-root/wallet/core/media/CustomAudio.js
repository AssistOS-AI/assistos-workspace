export default class CustomAudio{
    constructor(start, end, src) {
        this.start = start;
        this.end = end;
        this.audio = new Audio(src);
        this.audio.addEventListener("timeupdate", this.timeUpdate.bind(this));
        this.audio.addEventListener("play", this.handlePlay.bind(this));
    }
    handlePlay(){
        if(this.audio.currentTime < this.start){
            this.audio.currentTime = this.start;
        }
    }
    timeUpdate(){
        if(this.audio.currentTime >= this.end){
            this.audio.pause();
            this.audio.currentTime = this.start;
            const endedEvent = new Event('ended');
            this.audio.dispatchEvent(endedEvent);
        }
    }

}