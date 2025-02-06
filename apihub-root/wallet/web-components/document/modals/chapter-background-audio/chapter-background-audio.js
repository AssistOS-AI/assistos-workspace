const spaceModule = require("assistos").loadModule("space", {});
const documentModule = require("assistos").loadModule("document", {});
export class ChapterBackgroundAudio {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let chapterId = this.element.getAttribute("data-chapter-id");
        let documentViewPage = document.querySelector("document-view-page");
        this._document = documentViewPage.webSkelPresenter._document;
        this.chapter = this._document.chapters.find(chapter => chapter.id === chapterId);
        this.invalidate();
    }
    beforeRender(){

    }
    async afterRender(){
        if(this.chapter.backgroundSound){
            let audio = this.element.querySelector(".chapter-audio");
            let audioConfigs = this.element.querySelector(".audio-configs");
            audioConfigs.classList.remove("hidden");
            audio.src = await spaceModule.getAudioURL(this.chapter.backgroundSound.id);
            audio.load();
            audio.volume = this.chapter.backgroundSound.volume / 100;
            audio.loop = this.chapter.backgroundSound.loop;

            let loopInput = this.element.querySelector('#loop');
            if (this.chapter.backgroundSound.loop) {
                loopInput.checked = true;
            }
            loopInput.addEventListener("change", async () => {
                audio.loop = loopInput.checked;
                this.chapter.backgroundSound.loop = loopInput.checked;
                await documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, this.chapter.backgroundSound);
                await this.invalidateCompiledVideo();
            });
            let volumeInput = this.element.querySelector('#volume');
            volumeInput.value = this.chapter.backgroundSound.volume;
            volumeInput.addEventListener("input", () => {
                audio.volume = volumeInput.value / 100;
            });
        }
        this.fileInput = this.element.querySelector('.file-input');
        this.fileInput.addEventListener('change', this.uploadBackgroundSound.bind(this), {once: true});
    }
    uploadBackgroundSound(event) {
        const file = event.target.files[0];
        const maxFileSize = 100 * 1024 * 1024;
        if (!file) {
            return;
        }
        if (file.size > maxFileSize) {
            return showApplicationError("The file is too large.", "Maximum file size is 100MB.", "");
        }
        const reader = new FileReader();
        reader.onload = async (e) => {
            const uint8Array = new Uint8Array(e.target.result);
            let audioId = await spaceModule.putAudio(uint8Array);
            let audioPlayer = new Audio();
            audioPlayer.addEventListener("loadedmetadata", async () => {
                let backgroundSound = {
                    id: audioId,
                    volume: 50,
                    duration: audioPlayer.duration,
                    loop: false,
                    start: 0,
                    end: audioPlayer.duration
                };
                this.chapter.backgroundSound = backgroundSound;
                await documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, backgroundSound);
                await this.invalidateCompiledVideo();
                this.invalidate();
            });
            audioPlayer.src = URL.createObjectURL(file);
        };
        reader.readAsArrayBuffer(file);
    }

    insertAudio(_target) {
        this.fileInput.click();
    }

    async saveBackgroundSoundChanges(targetElement){
        let loopInput = this.element.querySelector('#loop');
        let volumeInput = this.element.querySelector('#volume');
        this.chapter.backgroundSound.loop = loopInput.checked;
        this.chapter.backgroundSound.volume = parseFloat(volumeInput.value);
        await documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, {
            id: this.chapter.backgroundSound.id,
            loop: loopInput.checked,
            volume: parseFloat(volumeInput.value),
            duration: this.chapter.backgroundSound.duration
        });
        await this.invalidateCompiledVideo();
        for(let paragraph of this.chapter.paragraphs){
            let paragraphPresenter = document.querySelector(`paragraph-item[data-paragraph-id="${paragraph.id}"]`).webSkelPresenter;
            if(paragraphPresenter.videoPresenter){
                let chapterAudioElement = paragraphPresenter.videoPresenter.chapterAudioElement;
                if(chapterAudioElement){
                    chapterAudioElement.volume = this.chapter.backgroundSound.volume / 100;
                    chapterAudioElement.loop = this.chapter.backgroundSound.loop;
                }
            }
        }
        this.closeModal();
    }

    async deleteBackgroundSound() {
        delete this.chapter.backgroundSound;
        await documentModule.updateChapterBackgroundSound(assistOS.space.id, this._document.id, this.chapter.id, null);
        await this.invalidateCompiledVideo();
        this.invalidate();
    }
    closeModal(){
        assistOS.UI.closeModal(this.element);
    }
    async invalidateCompiledVideo(){
        if(this.chapter.commands.compileVideo){
            delete this.chapter.commands.compileVideo;
            await documentModule.updateChapterCommands(assistOS.space.id, this._document.id, this.chapter.id, this.chapter.commands);
        }
    }
}