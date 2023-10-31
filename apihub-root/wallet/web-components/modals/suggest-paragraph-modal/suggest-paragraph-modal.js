import {
    sanitize,
    closeModal
} from "../../../imports.js";

export class suggestParagraphModal {
    constructor(element, invalidate) {
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this._chapter = this._document.getChapter(webSkel.space.currentChapterId);
        this._paragraph = this._chapter.getParagraph(webSkel.space.currentParagraphId);
        this.invalidate = invalidate;
        this.element = element;

        setTimeout(async()=>{
            let scriptId = webSkel.space.getScriptIdByName("suggest paragraph");
            let result = await webSkel.getService("LlmsService").callScript(scriptId, this._paragraph.toString());
            this.suggestedParagraph = result.responseJson.text;
            this.suggestedParagraphIdea = result.responseJson.mainIdea;
            this.invalidate();
        },0);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addSelectedParagraph(_target) {
        let altParagraphData = {text:sanitize(this.suggestedParagraph),
            id:webSkel.getService("UtilsService").generateId(), mainIdea:sanitize(this.suggestedParagraphIdea) };
        await this._document.addAlternativeParagraph(this._paragraph, altParagraphData);
        this._document.notifyObservers(this._document.getNotificationId());
        closeModal(_target);
    }
}