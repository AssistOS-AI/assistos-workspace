const Task = require('./Task');
const ffmpeg = require("../apihub-component-utils/ffmpeg");
const constants = require('./constants');
const STATUS = constants.STATUS;
const EVENTS = constants.EVENTS;
const TaskManager = require('./TaskManager');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const Storage = require('../apihub-component-utils/storage');
const volumeManager = require('../volumeManager.js');
const crypto = require('../apihub-component-utils/crypto');
const fileSys = require('../apihub-component-utils/fileSys.js')
class LipSync extends Task {
    constructor(spaceId, userId, configs) {
        super(spaceId, userId);
        this.documentId = configs.documentId;
        this.paragraphId = configs.paragraphId;
    }

    async runTask() {
        this.taskPromise = new Promise(async (resolve, reject) => {
            this.resolveTask = resolve;
            this.rejectTask = reject;
            try {
                const llmModule = await this.loadModule('llm');
                const documentModule = await this.loadModule('document');
                const utilModule = await this.loadModule('util');
                const spaceModule = await this.loadModule('space');
                const constants = require("assistos").constants;
                const paragraph = await documentModule.getParagraph(this.spaceId, this.documentId, this.paragraphId);

                try{
                    await constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "lipsync").VALIDATE(this.spaceId, paragraph, this.securityContext);
                }catch(error){
                    return this.rejectTask("Paragraph Must have a speech command before adding lip sync");
                }
                let taskId = paragraph.speech?.taskId;
                if (taskId) {
                    const task = TaskManager.getTask(taskId);
                    task.removeListener(EVENTS.DEPENDENCY_COMPLETED);
                    task.on(EVENTS.DEPENDENCY_COMPLETED, async () => {
                        this.setStatus(STATUS.RUNNING);
                        const paragraphCommands = await documentModule.getParagraphCommands(this.spaceId, this.documentId, this.paragraphId);
                        await this.executeLipSync(spaceModule, llmModule, utilModule, paragraphCommands);
                    });
                    this.setStatus(STATUS.PENDING);
                    return this.taskPromise;
                }
                await this.executeLipSync(spaceModule, llmModule, utilModule, paragraph.commands);
            } catch (e) {
                this.rejectTask(e);
            }
        });
        return this.taskPromise;
    }

    async executeLipSync(spaceModule, llmModule, utilModule, paragraphCommands) {
        this.timeout = setTimeout(async () => {
            this.rejectTask(new Error("Task took too long to complete"));
        }, 60000 * 10);
        if(!paragraphCommands.audio){
            return this.rejectTask(new Error("Audio File is missing"));
        }
        if (paragraphCommands.video) {
            await llmModule.lipSync(this.spaceId, this.id, paragraphCommands.video.id, paragraphCommands.audio.id);
        } else {
            const imageBuffer = Buffer.from(await spaceModule.getImage(paragraphCommands.image.id));
            const videoId = await ffmpeg.createVideoFromImageAndAudio(imageBuffer, paragraphCommands.audio.duration, this.spaceId);
            await llmModule.lipSync(this.spaceId, this.id, videoId, paragraphCommands.audio.id);
        }
    }

    async completeTaskExecution(videoURL) {
        clearTimeout(this.timeout);
        delete this.timeout;
        const spaceModule = await this.loadModule('space');
        const documentModule =  await this.loadModule('document');

        const tempFileId = crypto.generateId();
        const tempFilePath = path.join(volumeManager.paths.assets, Storage.fileTypes.videos, tempFileId);
        await fileSys.downloadData(videoURL, tempFilePath);

        const videoDuration = await ffmpeg.getVideoDuration(tempFilePath);
        const videoBuffer = await fsPromises.readFile(tempFilePath);
        const videoId = await spaceModule.putVideo(videoBuffer);
        let imageBuffer = await ffmpeg.createVideoThumbnail(tempFilePath);
        const imageId = await spaceModule.putImage(imageBuffer);

        const paragraphCommands = await documentModule.getParagraphCommands(this.spaceId, this.documentId, this.paragraphId);
        //save source id in lipsync command
        if(paragraphCommands.video){
            paragraphCommands.lipsync.videoId = paragraphCommands.video.id;
        } else if(paragraphCommands.image){
            paragraphCommands.lipsync.imageId = paragraphCommands.image.id;
        }
        paragraphCommands.video = {
            id: videoId,
            duration: videoDuration,
            thumbnailId: imageId,
            start: 0,
            end: videoDuration,
            volume: 100
        };
        delete paragraphCommands.lipsync.taskId;
        if(paragraphCommands.compileVideo){
            delete paragraphCommands.compileVideo;
        }
        await documentModule.updateParagraphCommands(this.spaceId, this.documentId, this.paragraphId, paragraphCommands);
        await fsPromises.unlink(tempFilePath);
        if (this.resolveTask) {
            this.resolveTask();
            this.resolveTask = null;
        }
    }



    async cancelTask() {
        clearTimeout(this.timeout);
    }

    serialize() {
        return {
            status: this.status,
            id: this.id,
            spaceId: this.spaceId,
            userId: this.userId,
            name: this.constructor.name,
            failMessage: this.failMessage,
            configs: {
                documentId: this.documentId,
                paragraphId: this.paragraphId,
                sourceCommand: "lipsync"
            }
        }
    }

    async getRelevantInfo() {
        let info = {}
        if (this.status === STATUS.FAILED) {
            info.failMessage = this.failMessage;
        }
        return info;
    }
}

module.exports = LipSync;
