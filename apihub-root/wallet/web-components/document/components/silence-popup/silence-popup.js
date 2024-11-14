const documentModule = require("assistos").loadModule("document", {});
const utilModule = require("assistos").loadModule("util", {});

export class SilencePopup{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.paragraphPresenter = this.element.closest("paragraph-item").webSkelPresenter;
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
        let commandsElement = this.paragraphPresenter.element.querySelector('.paragraph-commands');
        if (commandsElement.tagName === "DIV") {
            const testCommands = JSON.parse(JSON.stringify(this.paragraphPresenter.paragraph.commands));
            testCommands.silence = silenceCommand;
            const currentCommandsString = utilModule.buildCommandsString(testCommands);
            try {
                const currentCommandsObj = utilModule.findCommands(currentCommandsString);
                this.paragraphPresenter.paragraph.commands.silence = silenceCommand;
                await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraphId, this.paragraphPresenter.paragraph.commands);
                await this.paragraphPresenter.renderViewModeCommands();
                await this.paragraphPresenter.setupVideoPreview();
            } catch (e){
                return this.paragraphPresenter.showCommandsError(e.message);
            }
        } else {
            commandsElement.value += "\n";
            commandsElement.value += utilModule.buildCommandString("silence", silenceCommand);
            commandsElement.style.height = commandsElement.scrollHeight + "px";
        }
        this.audioMenuPresenter.invalidate();
        this.element.remove();
    }
}