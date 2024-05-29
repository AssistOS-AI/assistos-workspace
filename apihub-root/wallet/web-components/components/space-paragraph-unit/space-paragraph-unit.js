const {notificationService} = require("assistos").loadModule("util", {});
export class SpaceParagraphUnit{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this._document = document.querySelector("space-document-view-page").webSkelPresenter._document;
        let paragraphId = this.element.getAttribute("data-paragraph-id");
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.paragraph = this.chapter.getParagraph(paragraphId);
        this.refreshParagraph = async () =>{
            this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
        };
        this.invalidate();
    }
    beforeRender() {
        this["data-paragraph-content"] = this.paragraph.text;
        notificationService.on(this.paragraph.id, ()=>{
            let ttsUnit = this.element.querySelector('text-to-speech-unit');
            if(ttsUnit){
                this.openTTSUnit = true;
            }
            this.invalidate(this.refreshParagraph);
        });
    }
    afterRender() {
        if(this.openTTSUnit){
            this.openPersonalitiesPopUp(this.element);
            this.openTTSUnit = false;
        }
    }
    openPersonalitiesPopUp(_target){
        let personalitiesPopUp = `<text-to-speech-unit data-presenter="select-personality-tts" data-chapter-id="${this.chapter.id}" data-paragraph-id="${this.paragraph.id}"></text-to-speech-unit>`;
        this.element.insertAdjacentHTML('beforeend', personalitiesPopUp);
    }
}