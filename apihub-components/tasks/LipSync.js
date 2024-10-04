const Task = require('./Task');
const ffmpeg = require("../apihub-component-utils/ffmpeg");
const constants = require('./constants');
const STATUS = constants.STATUS;
const EVENTS = constants.EVENTS;
const TaskManager = require('./TaskManager');
const path = require('path');
const fsPromises = require('fs').promises;

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
                const spaceModule = require('assistos').loadModule('space', this.securityContext);

                const paragraph = await documentModule.getParagraph(this.spaceId, this.documentId, this.paragraphId);
                await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "lipsync").VALIDATE(this.spaceId, paragraph, this.securityContext);

                const paragraphCommands = paragraph.commands;
                let speechCommand = paragraphCommands.speech;
                if (!paragraphCommands.audio) {
                    if (!speechCommand) {
                        await this.rollback();
                        this.rejectTask("Paragraph Must have a speech command before adding lip sync");
                    } else {
                        let taskId = speechCommand.taskId;
                        let task = TaskManager.getTask(taskId);
                        task.removeListener(EVENTS.DEPENDENCY_COMPLETED);
                        task.on(EVENTS.DEPENDENCY_COMPLETED, async () => {
                            this.setStatus(STATUS.RUNNING);
                            let paragraphCommands = await documentModule.getParagraphCommands(this.spaceId, this.documentId, this.paragraphId);
                            await this.executeLipSync(spaceModule, llmModule, utilModule, paragraphCommands);
                        });
                        this.setStatus(STATUS.PENDING);
                        return this.taskPromise;
                    }
                }
                await this.executeLipSync(spaceModule, llmModule, utilModule, paragraphCommands);
            } catch (e) {
                await this.rollback();
                this.rejectTask(e);
            }
        });
        return this.taskPromise;
    }

    async executeLipSync(spaceModule, llmModule, utilModule, paragraphCommands) {
        this.timeout = setTimeout(async () => {
            await this.rollback();
            this.rejectTask(new Error("Task took too long to complete"));
        }, 60000 * 10);
        if (paragraphCommands.video) {
            await llmModule.lipSync(this.spaceId, this.id, paragraphCommands.video.id, paragraphCommands.audio.id, "sync-1.6.0");
        } else {
            const videoId = await ffmpeg.createVideoFromImageAndAudio(paragraphCommands.image.id, paragraphCommands.audio.duration, this.spaceId, this.securityContext);
            await llmModule.lipSync(this.spaceId, this.id, videoId, paragraphCommands.audio.id, "sync-1.6.0");
        }
    }

    async completeTaskExecution(videoURL) {
        clearTimeout(this.timeout);
        delete this.timeout;
        const spaceModule = require('assistos').loadModule('space', this.securityContext);
        const documentModule = require('assistos').loadModule('document', this.securityContext);

        const fileSys = require('../apihub-component-utils/fileSys.js')
        const space = require('../spaces-storage/space.js')
        const crypto = require('../apihub-component-utils/crypto.js')

        const tempFileId = crypto.generateId();
        const tempFilePath = path.join(space.APIs.getSpacePath(this.spaceId), "temp", `${tempFileId}.mp4`);
        await fileSys.downloadData(videoURL, tempFilePath);

        const videoBuffer = await fsPromises.readFile(tempFilePath);
        const videoDuration = await ffmpeg.getVideoDuration(tempFilePath);
        const videoId = await spaceModule.addVideo(this.spaceId, videoBuffer);
        const paragraphCommands = await documentModule.getParagraphCommands(this.spaceId, this.documentId, this.paragraphId);
        paragraphCommands.video = {
            id: videoId,
            duration: videoDuration
        };
        delete paragraphCommands.lipsync.taskId;
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
        clearTimeout(this.timeout);
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

    async getRelevantInfo() {
        let info = {
            documentId: this.documentId,
            paragraphId: this.paragraphId
        }
        if (this.status === STATUS.FAILED) {
            info.failMessage = this.failMessage;
        }
        return info;
    }
}

module.exports = LipSync;
