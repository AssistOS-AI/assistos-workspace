const fs = require('fs');
const Task = require('./Task');
const path = require('path');
const fsPromises = fs.promises;
const fileSys = require('../apihub-component-utils/fileSys');
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
        this.chapterTaskId = configs.chapterTaskId;
        this.processes = [];
    }
    async createVideo(){
        let paragraph;
        let pathPrefix;
        let documentModule = await this.loadModule("document", this.securityContext);
        if(!this.chapterTaskId){
            this.ffmpegExecutor = this;
            const spacePath = space.APIs.getSpacePath(this.spaceId);
            paragraph = await documentModule.getParagraph(this.spaceId, this.documentId, this.paragraphId);
            pathPrefix = path.join(spacePath, "temp", `${this.constructor.name}_${this.id}_temp`);
            await fsPromises.mkdir(pathPrefix, {recursive: true});
            this.workingDir = pathPrefix;
        } else {
            let TaskManager = require('./TaskManager');
            //use the chapter task to log and execute ffmpeg commands
            let chapterTask = TaskManager.getTask(this.chapterTaskId);
            this.ffmpegExecutor = chapterTask;
            paragraph = chapterTask.chapter.paragraphs.find(paragraph => paragraph.id === this.paragraphId);
            let paragraphIndex = chapterTask.chapter.paragraphs.indexOf(paragraph);
            pathPrefix = path.join(this.workingDir, `paragraph_${paragraphIndex}`);
            await fsPromises.mkdir(pathPrefix, {recursive: true});
        }
        const finalVideoPath = path.join(pathPrefix, `final.mp4`);
        if(paragraph.commands.compileVideo){
            this.ffmpegExecutor.logInfo(`Compiled video found for paragraph`);
            if(paragraph.commands.compileVideo.id){
                try {
                    await fsPromises.access(finalVideoPath);
                } catch (e){
                    this.ffmpegExecutor.logProgress(`Downloading compiled video`);
                    let {downloadURL} = await Storage.getDownloadURL(Storage.fileTypes.videos, paragraph.commands.compileVideo.id);
                    await fileSys.downloadData(downloadURL, finalVideoPath);
                    this.ffmpegExecutor.logProgress(`Verifying video integrity`);
                    await ffmpegUtils.verifyMediaFileIntegrity(finalVideoPath, this.ffmpegExecutor);
                    this.ffmpegExecutor.logProgress(`Verifying video settings`);
                    await ffmpegUtils.verifyVideoSettings(finalVideoPath, this.ffmpegExecutor);
                }
                return finalVideoPath;
            }
        }
        this.ffmpegExecutor.logInfo(`Creating video for paragraph`);
        let commands = paragraph.commands;
        if(commands.video){
            this.ffmpegExecutor.logProgress(`Video found`);
            const videoPath = path.join(pathPrefix, `video.mp4`);
            this.ffmpegExecutor.logProgress(`Downloading video`);
            let {downloadURL} = await Storage.getDownloadURL(Storage.fileTypes.videos, commands.video.id);
            await fileSys.downloadData(downloadURL, videoPath);
            this.ffmpegExecutor.logProgress(`Verifying video integrity`);
            await ffmpegUtils.verifyMediaFileIntegrity(videoPath, this.ffmpegExecutor);
            this.ffmpegExecutor.logProgress(`Verifying video settings`);
            await ffmpegUtils.verifyVideoSettings(videoPath, this.ffmpegExecutor);
            this.ffmpegExecutor.logProgress(`Adjusting video volume`);
            await ffmpegUtils.trimFileAdjustVolume(videoPath, commands.video.start, commands.video.end, commands.video.volume, this.ffmpegExecutor);
            if(commands.audio){
                this.ffmpegExecutor.logProgress(`Audio found`);

                let audioPath = path.join(pathPrefix, `audio.mp3`);
                await this.downloadAndPrepareAudio(commands.audio.id, commands.audio.volume, audioPath);
                this.ffmpegExecutor.logProgress(`Combining video and audio`);
                let videoDuration = commands.video.end - commands.video.start;
                await ffmpegUtils.combineVideoAndAudio(videoPath, audioPath, finalVideoPath,
                    this.ffmpegExecutor, commands.video.volume, commands.audio.volume, commands.audio.duration, videoDuration);
                await fsPromises.unlink(videoPath);
                await fsPromises.unlink(audioPath);
            } else {
                await fsPromises.rename(videoPath, finalVideoPath);
            }
        } else if(commands.audio){
            this.ffmpegExecutor.logProgress(`Audio found`);
            if(!commands.image){
                this.logError(`Paragraph doesnt have an image source`);
                throw new Error("Paragraph doesnt have a visual source");
            }
            let audioPath = path.join(pathPrefix, `audio.mp3`);
            await this.downloadAndPrepareAudio(commands.audio.id, commands.audio.volume, audioPath);

            this.ffmpegExecutor.logProgress(`Image found`);
            this.ffmpegExecutor.logProgress(`Downloading image`);
            let {downloadURL} = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            let imagePath = path.join(pathPrefix, `image.png`);
            await fileSys.downloadData(downloadURL, imagePath);

            this.ffmpegExecutor.logProgress(`Creating video from audio and image`);
            await ffmpegUtils.createVideoFromAudioAndImage(finalVideoPath, audioPath, imagePath, this.ffmpegExecutor);
            await fsPromises.unlink(audioPath);
            await fsPromises.unlink(imagePath);
        }else if(commands.silence){
            this.ffmpegExecutor.logProgress(`Silence found`);
            if(!commands.image){
                this.logError(`Paragraph doesnt have an image source`);
                throw new Error("Paragraph doesnt have a visual source");
            }
            this.ffmpegExecutor.logProgress(`Image found`);
            this.ffmpegExecutor.logProgress(`Downloading image`);
            let {downloadURL} = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            let imagePath = path.join(pathPrefix, `image.png`);
            await fileSys.downloadData(downloadURL, imagePath);

            this.ffmpegExecutor.logProgress(`Creating video from silence and image`);
            await ffmpegUtils.createVideoFromImage(finalVideoPath, imagePath, commands.silence.duration, this.ffmpegExecutor);
            await fsPromises.unlink(imagePath);
        } else if(commands.image){
            this.ffmpegExecutor.logProgress(`Image found`);
            this.ffmpegExecutor.logProgress(`Downloading image`);

            let imagePath = path.join(pathPrefix, `image.png`);
            let {downloadURL} = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            await fileSys.downloadData(downloadURL, imagePath);

            this.ffmpegExecutor.logProgress(`Creating video from image`);
            await ffmpegUtils.createVideoFromImage(finalVideoPath, imagePath, 1, this.ffmpegExecutor);
            await fsPromises.unlink(imagePath);
        } else {
            this.ffmpegExecutor.logProgress(`No visual source found, skipping paragraph`);
            return;
            //throw new Error("Paragraph doesnt have a visual source");
        }

        await this.attachEffectsToParagraphVideo(finalVideoPath, commands.effects, pathPrefix);

        this.ffmpegExecutor.logProgress(`Uploading final video`);
        await ffmpegUtils.verifyVideoSettings(finalVideoPath, this.ffmpegExecutor);
        await this.uploadFinalVideo(finalVideoPath, documentModule);
        this.ffmpegExecutor.logSuccess(`Video created for paragraph`);
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
        if(!effects || effects.length === 0){
            return;
        }
        this.ffmpegExecutor.logProgress('Beginning to attach effects to video');
        for(let effect of effects){
            let effectPath = path.join(pathPrefix, `effect_${effect.id}.mp3`);
            this.ffmpegExecutor.logProgress(`Downloading effect ${effects.indexOf(effect)}`);
            let {downloadURL} = await Storage.getDownloadURL(Storage.fileTypes.audios, effect.id);
            await fileSys.downloadData(downloadURL, effectPath);
            this.ffmpegExecutor.logProgress(`Verifying effect ${effects.indexOf(effect)} integrity`);
            await ffmpegUtils.verifyMediaFileIntegrity(effectPath, this.ffmpegExecutor);
            this.ffmpegExecutor.logProgress(`Verifying effect ${effects.indexOf(effect)} settings`);
            await ffmpegUtils.verifyAudioSettings(effectPath, this.ffmpegExecutor);
            this.ffmpegExecutor.logProgress(`Trimming effect and adjusting volume ${effects.indexOf(effect)}`);
            await ffmpegUtils.trimFileAdjustVolume(effectPath, effect.start, effect.end, effect.volume, this.ffmpegExecutor);
            effect.path = effectPath;
        }
        this.ffmpegExecutor.logProgress(`Adding effects to video`);
        await ffmpegUtils.addEffectsToVideo(effects, videoPath, this.ffmpegExecutor);
        for(let effect of effects){
            await fsPromises.unlink(effect.path);
            delete effect.path;
        }
    }

    async downloadAndPrepareAudio(audioId, volume, path){
        this.ffmpegExecutor.logProgress(`Downloading audio file`);
        let {downloadURL} = await Storage.getDownloadURL(Storage.fileTypes.audios, audioId);
        await fileSys.downloadData(downloadURL, path);
        this.ffmpegExecutor.logProgress(`Verifying audio file integrity`);
        await ffmpegUtils.verifyMediaFileIntegrity(path, this.ffmpegExecutor);
        this.ffmpegExecutor.logProgress(`Verifying audio settings`);
        await ffmpegUtils.verifyAudioSettings(path, this.ffmpegExecutor);
        this.ffmpegExecutor.logProgress(`Adjusting audio volume`);
        await ffmpegUtils.adjustAudioVolume(path, volume, this.ffmpegExecutor);
        await ffmpegUtils.normalizeVolume(path, this.ffmpegExecutor);
    }

    async cancelTask() {
        for(let process of this.processes){
            process.kill();
        }
        if(this.ffmpegExecutor === this){
            await fsPromises.rm(this.workingDir, {recursive: true, force: true});
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
                chapterTaskId: this.chapterTaskId
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