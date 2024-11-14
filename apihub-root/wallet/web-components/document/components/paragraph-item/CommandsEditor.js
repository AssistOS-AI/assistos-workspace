const constants = require("assistos").constants;
const modes = {
    NORMAL: "normal",
    ADVANCED: "advanced"
}
const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});

export default class CommandsEditor {
    constructor(documentId, paragraph, presenter) {
        this.documentId = documentId;
        this.paragraph = paragraph;
        this.presenter = presenter;
        this.editMode = modes.NORMAL;
    }
    renderCommands(){
        if(this.editMode === modes.NORMAL){
            this.renderViewModeCommands();
        } else {
            this.renderEditModeCommands();
        }
    }
    enterAdvancedEditMode() {
        this.editMode = modes.ADVANCED;
    }
    exitAdvancedEditMode() {
        this.editMode = modes.NORMAL;
    }
    async validateCommand(testParagraph, commandType, command) {
        testParagraph.commands[commandType] = command;
        return await constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === commandType)
            .VALIDATE(assistOS.space.id, testParagraph, {});
    }
    async deleteTaskFromCommand(commandName) {
        if (this.paragraph.commands[commandName].taskId) {
            let taskId = this.paragraph.commands[commandName].taskId;
            try {
                await utilModule.cancelTaskAndRemove(taskId);
                assistOS.space.notifyObservers(this.documentId + "/tasks");
            } catch (e) {
                //task has already been removed
            }
        }
    }
    async insertAttachmentCommand(type) {
        let attachmentData = await assistOS.UI.showModal(`insert-attachment-modal`, {type: type}, true);
        if (!attachmentData) {
            return;
        }
        if (this.editMode === modes.NORMAL) {
            let commandConfig = constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === type);
            if(commandConfig.TYPE === "array"){
                if(!this.paragraph.commands[type]){
                    this.paragraph.commands[type] = [];
                }
                this.paragraph.commands[type].push(attachmentData);
            } else {
                this.paragraph.commands[type] = attachmentData;
                if (this.paragraph.commands.lipsync) {
                    await this.handleCommand("lipsync", "changed");
                }
            }
            await documentModule.updateParagraphCommands(assistOS.space.id, this.documentId, this.paragraph.id, this.paragraph.commands);
            this.renderViewModeCommands();
            await this.presenter.setupVideoPreview();
            this.presenter.checkVideoAndAudioDuration();
        } else {
            let commands = this.presenter.element.querySelector('.paragraph-commands');
            let commandString = utilModule.buildCommandString(type, attachmentData);
            commands.value += "\n" + commandString;
            commands.style.height = commands.scrollHeight + 'px';
        }
    }
    deleteCommandArrayItem(type, itemId){
        let index = this.paragraph.commands[type].findIndex(command => command.id === itemId);
        if(index > -1){
            this.paragraph.commands[type].splice(index, 1);
        }
    }
    async deleteCommand(type, id) {
        if (this.editMode === modes.NORMAL) {
            let commandConfig = constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === type);
            if(commandConfig.TYPE === "array"){
                this.deleteCommandArrayItem(type, id);
            } else {
                if (this.paragraph.commands[type].taskId) {
                    await this.deleteTaskFromCommand(type);
                }
                delete this.paragraph.commands[type];
            }
            await documentModule.updateParagraphCommands(assistOS.space.id, this.documentId, this.paragraph.id, this.paragraph.commands);
            this.renderViewModeCommands();
            await this.presenter.setupVideoPreview();
            this.presenter.checkVideoAndAudioDuration();
        } else {
            let commands = this.presenter.element.querySelector('.paragraph-commands');
            let currentCommands;
            let commandConfig = constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === type);
            try {
                currentCommands = utilModule.findCommands(commands.value);
                if(commandConfig.TYPE === "array"){
                    let index = currentCommands[type].findIndex(command => command.id === id);
                    if(index > -1){
                        currentCommands[type].splice(index, 1);
                    }
                } else {
                    delete currentCommands[type];
                }
                commands.value = utilModule.buildCommandsString(currentCommands);
                commands.style.height = commands.scrollHeight + 'px';
            } catch (e){
                return this.showCommandsError(e.message);
            }
        }
        this.presenter.showUnfinishedTasks();
    }
    showCommandsError(error) {
        this.presenter.errorElement.classList.remove("hidden");
        this.presenter.errorElement.innerText = error;
    }
    hideCommandsError() {
        this.presenter.errorElement.classList.add("hidden");
        this.presenter.errorElement.innerText = "";
    }
    renderEditModeCommands() {
        this.enterAdvancedEditMode();
        let textareaContainer = this.presenter.element.querySelector('.header-section');
        let commandsElement = this.presenter.element.querySelector('.paragraph-commands');
        commandsElement.remove();
        let commandsHTML = this.buildCommandsHTML();
        textareaContainer.insertAdjacentHTML('beforeend', `<textarea class="paragraph-commands"></textarea>`);
        let paragraphCommands = this.presenter.element.querySelector('.paragraph-commands');
        paragraphCommands.value = commandsHTML;
        paragraphCommands.style.padding = `5px 10px`;
        paragraphCommands.style.height = paragraphCommands.scrollHeight + 'px';
        paragraphCommands.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });

    }

    renderViewModeCommands() {
        this.exitAdvancedEditMode();
        let headerSection = this.presenter.element.querySelector('.header-section');
        let commandsElement = this.presenter.element.querySelector('.paragraph-commands');
        commandsElement.remove();
        let commandsHTML = this.buildCommandsHTML();
        headerSection.insertAdjacentHTML('beforeend', `<div class="paragraph-commands">${commandsHTML}</div>`);
        let paragraphHeader = this.presenter.element.querySelector('.paragraph-commands');
        paragraphHeader.style.height = "initial";
        if (paragraphHeader.innerHTML === "") {
            paragraphHeader.style.padding = "0";
        } else {
            paragraphHeader.style.padding = "5px 10px";
        }
    }
    buildCommandsHTML() {
        let html = "";
        if (this.editMode === modes.NORMAL) {
            let commands = utilModule.getSortedCommandsArray(this.paragraph.commands);
            let allAttachmentHighlights = this.presenter.element.querySelectorAll(".attachment-circle");
            allAttachmentHighlights.forEach(attachment => {
                attachment.classList.remove("highlight-attachment");
            });
            for (let command of commands) {
                if (command.name === "image") {
                    let attachmentHighlight = this.presenter.element.querySelector(".attachment-circle.image");
                    attachmentHighlight.classList.add("highlight-attachment");
                } else if (command.name === "audio") {
                    let attachmentHighlight = this.presenter.element.querySelector(".attachment-circle.audio");
                    attachmentHighlight.classList.add("highlight-attachment");
                } else if (command.name === "video") {
                    let attachmentHighlight = this.presenter.element.querySelector(".attachment-circle.video");
                    attachmentHighlight.classList.add("highlight-attachment");
                }
            }
            if(this.paragraph.comment.trim() !== ""){
                let commentHighlight = this.presenter.element.querySelector(".attachment-circle.comment");
                commentHighlight.classList.add("highlight-attachment");
            }
        } else {
            html = utilModule.buildCommandsString(this.paragraph.commands);
        }
        return html;
    }
    async saveCommands(eventController){
        let commandsElement = this.presenter.element.querySelector('.paragraph-commands');
        let commands;
        try {
            commands = utilModule.findCommands(commandsElement.value);
        } catch (e) {
            return this.showCommandsError(e.message);
        }
        commandsElement.value = utilModule.buildCommandsString(commands);
        const commandsDifferences = utilModule.getCommandsDifferences(this.paragraph.commands, commands);
        const existCommandsDifferences = Object.values(commandsDifferences).some(value => value !== "same");

        if (!existCommandsDifferences) {
            /* there is nothing further to do, and there are no syntax errors */
            this.hideCommandsError();
            this.renderViewModeCommands();
            eventController.abort();
            return;
        }
        let testParagraph = JSON.parse(JSON.stringify(this.paragraph));
        for (const [commandType, commandStatus] of Object.entries(commandsDifferences)) {
            try {
                if (commandStatus === "deleted") {

                } else if(commandStatus !== "same") {
                    await this.validateCommand(testParagraph, commandType, commands[commandType]);
                }
            } catch (error) {
                this.showCommandsError(error);
                return;
            }
        }
        eventController.abort();
        this.hideCommandsError();
        for (let [commandName, commandStatus] of Object.entries(commandsDifferences)) {
            if (commandStatus === "changed" || commandStatus === "deleted") {
                await this.handleCommand(commandName, commandStatus);
            }
        }
        this.paragraph.commands = commands;
        for (let [commandName, commandStatus] of Object.entries(commandsDifferences)) {
            if (commandStatus === "new") {
                await this.handleCommand(commandName, commandStatus);
            }
        }
        await documentModule.updateParagraphCommands(assistOS.space.id, this.documentId, this.paragraph.id, this.paragraph.commands);
        this.renderViewModeCommands();
        await this.presenter.setupVideoPreview();
        this.presenter.showUnfinishedTasks();
    }
    async handleCommand(commandName, commandStatus) {
        if (constants.COMMANDS_CONFIG.ATTACHMENTS.includes(commandName)) {
            return;
        }
        if (commandStatus === "new") {
            const taskId = await constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === commandName).EXECUTE(assistOS.space.id, this.documentId, this.paragraph.id, {});
            this.paragraph.commands[commandName].taskId = taskId;
            await this.presenter.addUITask(taskId);
        } else if (commandStatus === "changed") {
            if (this.paragraph.commands[commandName].taskId) {
                //cancel the task so it can be re-executed, same if it was cancelled, failed, pending
                let taskId = this.paragraph.commands[commandName].taskId;
                try {
                    utilModule.cancelTask(taskId);
                } catch (e) {
                    // task is not running
                }
            } else {
                const taskId = await constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === commandName).EXECUTE(assistOS.space.id, this.documentId, this.paragraph.id, {});
                this.paragraph.commands[commandName].taskId = taskId;
                await this.presenter.addUITask(taskId);
            }
        } else if (commandStatus === "deleted") {
            await this.deleteTaskFromCommand(commandName);
        }
    }
    async insertCommandWithTask(name, data) {
        if (this.editMode === modes.NORMAL) {
            if(this.paragraph.commands[name]){
                await this.handleCommand(name, "changed");
                data.taskId = this.paragraph.commands[name].taskId;
                this.paragraph.commands[name] = data;
            } else {
                this.paragraph.commands[name] = data;
                await this.handleCommand(name, "new");
            }
            this.renderViewModeCommands();
        } else {
            this.appendCommandAdvancedMode(name, data);
        }
        this.presenter.showUnfinishedTasks();
    }
    appendCommandAdvancedMode(name, data) {
        let commands = this.presenter.element.querySelector('.paragraph-commands');
        let commandString = utilModule.buildCommandString(name, data);
        commands.value += "\n" + commandString;
        commands.style.height = commands.scrollHeight + 'px';
    }
    insertSimpleCommand(name, data) {
        if (this.editMode === modes.NORMAL) {
            this.paragraph.commands[name] = data;
            this.renderViewModeCommands();
            return true;
        } else {
            this.appendCommandAdvancedMode(name, data);
            return false;
        }
    }
}