const documentModule = require("assistos").loadModule("document", {});
const utilModule = require("assistos").loadModule("util", {});

export class SilencePopup{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this._document = document.querySelector("document-view-page").webSkelPresenter._document;
        this.parentPresenter = this.element.closest("paragraph-item").webSkelPresenter;
        this.paragraphId = this.parentPresenter.paragraph.id;
        this.invalidate();
        this.element.setAttribute("data-local-action", "editItem silencePopup");
        this.element.setAttribute("id", "current-selection");
    }
    beforeRender() {

    }
    async insertSilenceCommand() {
        let durationInput = this.element.querySelector("#duration");
        let silenceCommand = {
            duration: parseInt(durationInput.value)
        }
        let commandsElement = this.parentPresenter.element.querySelector('.paragraph-commands');
        if (commandsElement.tagName === "DIV") {
            const testCommands = JSON.parse(JSON.stringify(this.parentPresenter.paragraph.commands));
            testCommands.silence = silenceCommand;

            const currentCommandsString = utilModule.buildCommandsString(testCommands);
            const currentCommandsObj = utilModule.findCommands(currentCommandsString);
            if (currentCommandsObj.invalid === true) {
                const errorElement = this.parentPresenter.element.querySelector(".error-message");
                if (errorElement.classList.contains("hidden")) {
                    errorElement.classList.remove("hidden");
                }
                errorElement.innerText = currentCommandsObj.error;
            } else {
                this.parentPresenter.paragraph.commands.silence = silenceCommand;
                await documentModule.updateParagraphCommands(assistOS.space.id, this._document.id, this.paragraphId, this.parentPresenter.paragraph.commands);
                await this.parentPresenter.renderViewModeCommands();
                await this.parentPresenter.setupVideoPreview();
            }
        } else {
            commandsElement.value += "\n";
            commandsElement.value += utilModule.buildCommandString("silence", silenceCommand);
            commandsElement.style.height = commandsElement.scrollHeight + "px";
        }
        this.element.remove();
    }
}