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
class ParagraphToVideo extends Task {
    constructor(spaceId, userId, configs) {
        super(spaceId, userId);
        this.documentId = configs.documentId;
        this.chapterId = configs.chapterId;
        this.paragraphId = configs.paragraphId;
        this.workingDir = configs.workingDir;
        this.documentTaskId = configs.documentTaskId;
    }
    async runTask() {
        let TaskManager = require('./TaskManager');
        let documentTask = TaskManager.getTask(this.documentTaskId);

        let pathPrefix = path.join(this.workingDir, `paragraph_${this.paragraphId}`);
        await fsPromises.mkdir(pathPrefix, {recursive: true});
        const finalVideoPath = path.join(pathPrefix, `final.mp4`);
        let chapter = documentTask.document.chapters.find(chapter => chapter.id === this.chapterId);
        let paragraph = chapter.paragraphs.find(paragraph => paragraph.id === this.paragraphId);
        let commands = paragraph.commands;
        if(commands.video){
            const videoPath = path.join(pathPrefix, `video.mp4`);
            let videoURL = await Storage.getDownloadURL(Storage.fileTypes.videos, commands.video.id);
            await fileSys.downloadData(videoURL, videoPath);
            await ffmpegUtils.verifyVideoSettings(videoPath, documentTask);
            await ffmpegUtils.verifyMediaFileIntegrity(videoPath, documentTask);
            await ffmpegUtils.adjustVideoVolume(videoPath, commands.video.volume, documentTask);
            if(commands.audio){
                if(commands.video.duration < commands.audio.duration){
                    throw new Error(`Audio duration is longer than video duration`);
                }

                let audioPath = path.join(pathPrefix, `audio.mp3`);
                await this.downloadAndPrepareAudio(commands.audio.id, commands.audio.volume, audioPath, documentTask);

                await ffmpegUtils.combineVideoAndAudio(videoPath, audioPath, finalVideoPath, documentTask, commands.video.volume, commands.audio.volume);
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
            await this.downloadAndPrepareAudio(commands.audio.id, commands.audio.volume, audioPath, documentTask);

            let imageURL = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            let imagePath = path.join(pathPrefix, `image.png`);
            await fileSys.downloadData(imageURL, imagePath);

            await ffmpegUtils.createVideoFromAudioAndImage(finalVideoPath, audioPath, imagePath, documentTask);
            await fsPromises.unlink(audioPath);
            await fsPromises.unlink(imagePath);
        }else if(commands.silence){
            if(!commands.image){
                throw new Error("Paragraph doesnt have a visual source");
            }

            let imageURL = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            let imagePath = path.join(pathPrefix, `image.png`);
            await fileSys.downloadData(imageURL, imagePath);
            await ffmpegUtils.createVideoFromImage(finalVideoPath, imagePath, commands.silence.duration, documentTask);
            await fsPromises.unlink(imagePath);
        } else if(commands.image){
            let imagePath = path.join(pathPrefix, `image.png`);
            let imageURL = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            await fileSys.downloadData(imageURL, imagePath);
            await ffmpegUtils.createVideoFromImage(finalVideoPath, imagePath, 1, documentTask);
            await fsPromises.unlink(imagePath);
        }
        await this.attachEffectsToParagraphVideo(finalVideoPath, commands.effects, pathPrefix, documentTask);
        return finalVideoPath;
    }
    async attachEffectsToParagraphVideo(videoPath, effects, pathPrefix, documentTask){
        if(!effects){
            return;
        }
        for(let effect of effects){
            let effectPath = path.join(pathPrefix, `effect_${effect.id}.mp3`);
            let effectURL = await Storage.getDownloadURL(Storage.fileTypes.audios, effect.id);
            await fileSys.downloadData(effectURL, effectPath);
            await ffmpegUtils.verifyMediaFileIntegrity(effectPath, documentTask);
            await ffmpegUtils.verifyAudioSettings(effectPath, documentTask);
            await ffmpegUtils.trimAudioAdjustVolume(effectPath, effect.start, effect.end, effect.volume, documentTask);
            effect.path = effectPath;
        }
        await ffmpegUtils.addEffectsToVideo(effects, videoPath, documentTask);
        for(let effect of effects){
            await fsPromises.unlink(effect.path);
            delete effect.path;
        }
    }
    async downloadAndPrepareAudio(audioId, volume, path, documentTask){
        let audioURL = await Storage.getDownloadURL(Storage.fileTypes.audios, audioId);
        await fileSys.downloadData(audioURL, path);
        await ffmpegUtils.verifyMediaFileIntegrity(path, documentTask);
        await ffmpegUtils.verifyAudioSettings(path, documentTask);
        await ffmpegUtils.adjustAudioVolume(path, volume, documentTask);
    }
    cancelTask() {

    }
    serialize() {
        return{
            id: this.id,
            status: this.status,
            spaceId: this.spaceId,
            userId: this.userId,
            name: this.constructor.name,
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