const {notificationService} = require("assistos").loadModule("util", {});
export class SpaceParagraphUnit{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentPresenter = document.querySelector("space-document-view-page").webSkelPresenter;
        this._document = this.documentPresenter._document;
        let paragraphId = this.element.getAttribute("data-paragraph-id");
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.paragraph = this.chapter.getParagraph(paragraphId);
        this.invalidate();
    }
    beforeRender() {
        this["data-paragraph-content"] = this.paragraph.text;
        notificationService.on(this.paragraph.id, async ()=>{
            let ttsUnit = this.element.querySelector('text-to-speech-unit');
            if(ttsUnit){
                this.openTTSUnit = true;
            }
            let paragraphDiv = this.element.querySelector(".paragraph-text");
            let paragraphText = assistOS.UI.sanitize(assistOS.UI.customTrim(paragraphDiv.innerText));
            if(!paragraphText){
                paragraphText = "";
            }
            this.paragraph = await this.chapter.refreshParagraph(assistOS.space.id, this._document.id, this.paragraph.id);
            if (paragraphText !== this.paragraph.text) {
                this.invalidate();
            }
        });
    }
    afterRender() {
        if(this.openTTSUnit){
            this.openPersonalitiesPopUp(this.element);
            this.openTTSUnit = false;
        }
        if(assistOS.space.currentParagraphId === this.paragraph.id){
            this.documentPresenter.editParagraph(this.element.querySelector(".paragraph-text"))
        }
    }
    openPersonalitiesPopUp(_target){
        let personalitiesPopUp = `<text-to-speech-unit data-presenter="select-personality-tts" data-chapter-id="${this.chapter.id}" data-paragraph-id="${this.paragraph.id}"></text-to-speech-unit>`;
        this.element.insertAdjacentHTML('beforeend', personalitiesPopUp);
    }
}