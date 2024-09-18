const Task = require('./Task');

class LipSync extends Task {
    constructor(securityContext, spaceId, userId, configs) {
        super(securityContext, spaceId, userId);
        this.documentId = configs.documentId;
        this.paragraphId = configs.paragraphId;
    }

    async runTask() {
        this.taskPromise = new Promise(async (resolve, reject) => {
            this.resolveTask = resolve;
            this.rejectTask = reject;
            try {
                const llmModule = require('assistos').loadModule('llm', this.securityContext);
                const documentModule = require('assistos').loadModule('document', this.securityContext);
                const utilModule = require('assistos').loadModule('util', this.securityContext);

                const paragraph = await documentModule.getParagraph(this.spaceId, this.documentId, this.paragraphId);
                await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "lipsync").VALIDATE(this.spaceId, paragraph, this.securityContext);

                const paragraphConfig = paragraph.commands;

                await llmModule.lipSync(this.spaceId, this.id, utilModule.constants.getImageSrc(this.spaceId, paragraphConfig.image.id),
                    utilModule.constants.getAudioSrc(this.spaceId, paragraphConfig.audio.id), "sync-1.6.0");
            } catch (e) {
                await this.rollback();
                this.rejectTask(e);
            }
        });
        return this.taskPromise;
    }

    async completeTaskExecution(videoURL) {
        const spaceModule = require('assistos').loadModule('space', this.securityContext);
        const documentModule = require('assistos').loadModule('document', this.securityContext);
        const videoId = await spaceModule.addVideo(this.spaceId, videoURL);
        const paragraphCommands = await documentModule.getParagraphCommands(this.spaceId, this.documentId, this.paragraphId);
        paragraphCommands.video = {id: videoId};
        await documentModule.updateParagraphCommands(this.spaceId, this.documentId, this.paragraphId, paragraphCommands);
        if (this.resolveTask) {
            this.resolveTask();
            this.resolveTask = null;
        }
    }


    async rollback() {
        try {

        } catch (e) {
            //no audio to delete
        }
    }

    async cancelTask() {
        await this.rollback();
    }

    serialize() {
        return {
            status: this.status,
            id: this.id,
            spaceId: this.spaceId,
            userId: this.userId,
            securityContext: this.securityContext,
            name: this.constructor.name,
            configs: {
                documentId: this.documentId,
                paragraphId: this.paragraphId,
            }
        }
    }
}

module.exports = LipSync;
