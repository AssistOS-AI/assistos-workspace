const documentModule = require("assistos").loadModule("document", {});
const utilModule = require("assistos").loadModule("util", {});

export class SilencePopup{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.paragraphPresenter = this.element.closest("paragraph-item").webSkelPresenter;
        this.commandsEditor = this.paragraphPresenter.commandsEditor;
        this._document = this.paragraphPresenter._document;
        this.audioMenuPresenter = this.element.closest("audio-menu").webSkelPresenter;
        this.paragraphId = this.paragraphPresenter.paragraph.id;
        this.invalidate();
        this.element.classList.add("maintain-focus");
        this.element.classList.add("insert-modal");
    }
    beforeRender() {

    }
    async insertSilenceCommand() {
        let durationInput = this.element.querySelector("#duration");
        let silenceCommand = {
            duration: parseInt(durationInput.value)
        }
        let refreshVideo = this.commandsEditor.insertSimpleCommand("silence", silenceCommand);
        if(refreshVideo) {
            await this.paragraphPresenter.setupVideoPreview();
        }
        this.audioMenuPresenter.invalidate();
        this.element.remove();
    }
}