const fs = require('fs');
const Task = require('./Task');
const path = require('path');
const fsPromises = fs.promises;
const fileSys = require('../apihub-component-utils/fileSys');
const space = require('../spaces-storage/space');
const ffmpegUtils = require("../apihub-component-utils/ffmpeg");
const Storage = require("../apihub-component-utils/storage");
const constants = require('./constants');
const STATUS = constants.STATUS;
const crypto = require("../apihub-component-utils/crypto");
const {exec} = require("child_process");
class ParagraphToVideo extends Task {
    constructor(spaceId, userId, configs) {
        super(spaceId, userId);
        this.documentId = configs.documentId;
        this.chapterId = configs.chapterId;
        this.paragraphId = configs.paragraphId;
        this.workingDir = configs.workingDir;
        this.documentTaskId = configs.documentTaskId;
        this.processes = [];
    }
    async createVideo(){
        let paragraph;
        let pathPrefix;
        let documentModule = await this.loadModule("document", this.securityContext);
        paragraph = await documentModule.getParagraph(this.spaceId, this.documentId, this.paragraphId);
        paragraph.commands.compileVideo = {
            taskId: this.id
        };
        await documentModule.updateParagraphCommands(this.spaceId, this.documentId, this.paragraphId, paragraph.commands);
        if(!this.documentTaskId){
            this.ffmpegExecutor = this;
            const spacePath = space.APIs.getSpacePath(this.spaceId);
            pathPrefix = path.join(spacePath, "temp", `${this.constructor.name}_${this.id}_temp`);
            await fsPromises.mkdir(pathPrefix, {recursive: true});
            this.workingDir = pathPrefix;
        } else {
            let TaskManager = require('./TaskManager');
            this.ffmpegExecutor = TaskManager.getTask(this.documentTaskId);
            let document = this.ffmpegExecutor.document;
            let chapter = document.chapters.find(chapter => chapter.id === this.chapterId);
            let paragraphIndex = chapter.paragraphs.indexOf(paragraph);
            pathPrefix = path.join(this.workingDir, `paragraph_${paragraphIndex}`);
            await fsPromises.mkdir(pathPrefix, {recursive: true});
        }
        const finalVideoPath = path.join(pathPrefix, `final.mp4`);
        if(paragraph.commands.compileVideo){
            if(paragraph.commands.compileVideo.id){
                try {
                    await fsPromises.access(finalVideoPath);
                } catch (e){
                    let url = await Storage.getDownloadURL(Storage.fileTypes.videos, paragraph.commands.compileVideo.id);
                    await fileSys.downloadData(url, finalVideoPath);
                    await ffmpegUtils.verifyMediaFileIntegrity(finalVideoPath, this.ffmpegExecutor);
                    await ffmpegUtils.verifyVideoSettings(finalVideoPath, this.ffmpegExecutor);
                }
                return finalVideoPath;
            }
        }
        let commands = paragraph.commands;
        if(commands.video){
            const videoPath = path.join(pathPrefix, `video.mp4`);
            let videoURL = await Storage.getDownloadURL(Storage.fileTypes.videos, commands.video.id);
            await fileSys.downloadData(videoURL, videoPath);
            await ffmpegUtils.verifyMediaFileIntegrity(videoPath, this.ffmpegExecutor);
            await ffmpegUtils.verifyVideoSettings(videoPath, this.ffmpegExecutor);
            await ffmpegUtils.adjustVideoVolume(videoPath, commands.video.volume, this.ffmpegExecutor);
            if(commands.audio){
                if(commands.video.duration < commands.audio.duration){
                    throw new Error(`Audio duration is longer than video duration`);
                }

                let audioPath = path.join(pathPrefix, `audio.mp3`);
                await this.downloadAndPrepareAudio(commands.audio.id, commands.audio.volume, audioPath);

                await ffmpegUtils.combineVideoAndAudio(videoPath, audioPath, finalVideoPath, this.ffmpegExecutor, commands.video.volume, commands.audio.volume);
                await fsPromises.unlink(videoPath);
                await fsPromises.unlink(audioPath);
            } else {
                await fsPromises.rename(videoPath, finalVideoPath);
            }
        } else if(commands.audio){
            if(!commands.image){
                throw new Error("Paragraph doesnt have a visual source");
            }
            let audioPath = path.join(pathPrefix, `audio.mp3`);
            await this.downloadAndPrepareAudio(commands.audio.id, commands.audio.volume, audioPath);

            let imageURL = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            let imagePath = path.join(pathPrefix, `image.png`);
            await fileSys.downloadData(imageURL, imagePath);

            await ffmpegUtils.createVideoFromAudioAndImage(finalVideoPath, audioPath, imagePath, this.ffmpegExecutor);
            await fsPromises.unlink(audioPath);
            await fsPromises.unlink(imagePath);
        }else if(commands.silence){
            if(!commands.image){
                throw new Error("Paragraph doesnt have a visual source");
            }

            let imageURL = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            let imagePath = path.join(pathPrefix, `image.png`);
            await fileSys.downloadData(imageURL, imagePath);
            await ffmpegUtils.createVideoFromImage(finalVideoPath, imagePath, commands.silence.duration, this.ffmpegExecutor);
            await fsPromises.unlink(imagePath);
        } else if(commands.image){
            let imagePath = path.join(pathPrefix, `image.png`);
            let imageURL = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            await fileSys.downloadData(imageURL, imagePath);
            await ffmpegUtils.createVideoFromImage(finalVideoPath, imagePath, 1, this.ffmpegExecutor);
            await fsPromises.unlink(imagePath);
        } else {
            throw new Error("Paragraph doesnt have a visual source");
        }
        await this.attachEffectsToParagraphVideo(finalVideoPath, commands.effects, pathPrefix);

        await this.uploadFinalVideo(finalVideoPath, documentModule);
        return finalVideoPath;
    }
    async runTask() {
        try {
            return await this.createVideo();
        } catch (e) {
            for(let process of this.processes){
                process.kill();
            }
            throw e;
        }
    }
    async uploadFinalVideo(finalVideoPath, documentModule){
        let readStream = fs.createReadStream(finalVideoPath);
        let videoId = crypto.generateId();
        await Storage.putFile(Storage.fileTypes.videos, videoId, readStream);
        let paragraphCommands = await documentModule.getParagraphCommands(this.spaceId, this.documentId, this.paragraphId);
        paragraphCommands.compileVideo = {
            id: videoId
        };
        await documentModule.updateParagraphCommands(this.spaceId, this.documentId, this.paragraphId, paragraphCommands);
        if(this.ffmpegExecutor === this){
            await fsPromises.rm(this.workingDir, {recursive: true, force: true});
        }
    }
    async attachEffectsToParagraphVideo(videoPath, effects, pathPrefix){
        if(!effects){
            return;
        }
        for(let effect of effects){
            let effectPath = path.join(pathPrefix, `effect_${effect.id}.mp3`);
            let effectURL = await Storage.getDownloadURL(Storage.fileTypes.audios, effect.id);
            await fileSys.downloadData(effectURL, effectPath);
            await ffmpegUtils.verifyMediaFileIntegrity(effectPath, this.ffmpegExecutor);
            await ffmpegUtils.verifyAudioSettings(effectPath, this.ffmpegExecutor);
            await ffmpegUtils.trimAudioAdjustVolume(effectPath, effect.start, effect.end, effect.volume, this.ffmpegExecutor);
            effect.path = effectPath;
        }
        await ffmpegUtils.addEffectsToVideo(effects, videoPath, this.ffmpegExecutor);
        for(let effect of effects){
            await fsPromises.unlink(effect.path);
            delete effect.path;
        }
    }

    async downloadAndPrepareAudio(audioId, volume, path){
        let audioURL = await Storage.getDownloadURL(Storage.fileTypes.audios, audioId);
        await fileSys.downloadData(audioURL, path);
        await ffmpegUtils.verifyMediaFileIntegrity(path, this.ffmpegExecutor);
        await ffmpegUtils.verifyAudioSettings(path, this.ffmpegExecutor);
        await ffmpegUtils.adjustAudioVolume(path, volume, this.ffmpegExecutor);
    }

    cancelTask() {
        for(let process of this.processes){
            process.kill();
        }
    }
    runCommand(command) {
        return new Promise((resolve, reject) => {
            let childProcess = exec(command, (error, stdout, stderr) => {
                this.processes = this.processes.filter(p => p !== childProcess);
                if (error) {
                    reject(stderr || error.message);
                    return;
                }
                resolve(stdout || stderr);
            });
            this.processes.push(childProcess);
        });
    }
    serialize() {
        return{
            id: this.id,
            status: this.status,
            spaceId: this.spaceId,
            userId: this.userId,
            name: this.constructor.name,
            failMessage: this.failMessage,
            configs:{
                spaceId: this.spaceId,
                documentId: this.documentId,
                chapterId: this.chapterId,
                paragraphId: this.paragraphId,
                workingDir: this.workingDir,
                documentTaskId: this.documentTaskId,
            }
        }
    }
    async getRelevantInfo() {
        if (this.status === STATUS.FAILED) {
            return this.failMessage;
        } else return "Creating video for paragraph";
    }
}
module.exports = ParagraphToVideo;