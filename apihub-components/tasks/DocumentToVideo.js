const {exec, spawn} = require("child_process");
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
class DocumentToVideo extends Task {
    constructor(spaceId, userId, configs) {
        super(spaceId, userId);
        this.processes = [];
        this.documentId = configs.documentId;
        //TODO: gather all errors and return them in the end
    }
    async runTask(){
        const spacePath = space.APIs.getSpacePath(this.spaceId);
        let tempVideoDir = path.join(spacePath, "videos", `${this.id}_temp`);
        await fsPromises.mkdir(tempVideoDir, {recursive: true});
        let promises = [];
        const documentModule = await this.loadModule("document", this.securityContext);
        this.document = await documentModule.getDocument(this.spaceId, this.documentId);
        this.document.chapters.map(async (chapter, index) => {
            promises.push(this.createChapterVideo(this.spaceId, chapter, tempVideoDir, this.document.id, index));
        });

        let chapterVideos = [];
        try {
            chapterVideos = await Promise.all(promises);
        } catch (e) {
            await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
            for(let process of this.processes){
                process.kill();
            }
            throw new Error(`Failed to create chapter video: ${e}`);
        }
        chapterVideos = chapterVideos.filter(videoPath => typeof videoPath !== "undefined");
        try {
            let videoPath = path.join(spacePath, "videos", `${this.id}.mp4`);
            await ffmpegUtils.combineVideos(
                tempVideoDir,
                chapterVideos,
                `chapter_videos.txt`,
                videoPath,
                this);
            await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
            return videoPath;
        } catch (e) {
            await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
            for(let process of this.processes){
                process.kill();
            }
            throw new Error(`Failed to combine chapter videos: ${e}`);
        }
    }
    async cancelTask(){
        for(let process of this.processes){
            process.kill();
        }
        const spacePath = space.APIs.getSpacePath(this.spaceId);
        let tempVideoDir = path.join(spacePath, "videos", `${this.id}_temp`);
        await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
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
            configs:{
                spaceId: this.spaceId,
                documentId: this.documentId,
            }
        }
    }
    async createChapterVideo(spaceId, chapter, tempVideoDir, documentId, chapterIndex){
        let completedFramePaths = [];
        let pathPrefix = path.join(tempVideoDir, `chapter_${chapterIndex}`);
        for(let i = 0; i < chapter.paragraphs.length; i++){
            try{
                let videoPath = await this.createBaseParagraphVideo(chapter.paragraphs[i], `${pathPrefix}_paragraph_${i}`);
                await this.attachEffectsToParagraphVideo(videoPath, chapter.paragraphs[i].commands.effects, `${pathPrefix}_paragraph_${i}`);
                completedFramePaths.push(videoPath);
            } catch (e) {
                throw new Error(`Failed to create video for chapter ${chapterIndex}, paragraph ${i}: ${e}`);
            }
        }
        completedFramePaths = completedFramePaths.filter(videoPath => typeof videoPath !== "undefined");
        let outputVideoPath = path.join(tempVideoDir, `chapter_${chapterIndex}_video.mp4`);
        await ffmpegUtils.combineVideos(
            tempVideoDir,
            completedFramePaths,
            `chapter_${chapterIndex}_frames.txt`,
            outputVideoPath,
            this);
        if(chapter.backgroundSound){
            let chapterAudioPath = path.join(tempVideoDir, `chapter_${chapterIndex}_audio.mp3`);
            let chapterAudioURL = await Storage.getDownloadURL(Storage.fileTypes.audios, chapter.backgroundSound.id);
            await fileSys.downloadData(chapterAudioURL, chapterAudioPath);
            await ffmpegUtils.addBackgroundSoundToVideo(outputVideoPath, chapterAudioPath, chapter.backgroundSound.volume, chapter.backgroundSound.loop, this);
            await fsPromises.unlink(chapterAudioPath);
        }
        return outputVideoPath;
    }

    async createBaseParagraphVideo(paragraph, pathPrefix){
        const finalVideoPath = `${pathPrefix}_final.mp4`;

        let commands = paragraph.commands;
        if(commands.video){
            const videoPath = `${pathPrefix}_video.mp4`;
            let videoURL = await Storage.getDownloadURL(Storage.fileTypes.videos, commands.video.id);
            await fileSys.downloadData(videoURL, videoPath);
            await ffmpegUtils.verifyVideoSettings(videoPath, this);
            await ffmpegUtils.verifyMediaFileIntegrity(videoPath, this);
            await ffmpegUtils.adjustVideoVolume(videoPath, commands.video.volume, this);
            if(commands.audio){
                if(commands.video.duration < commands.audio.duration){
                    throw new Error(`Audio duration is longer than video duration`);
                }

                let audioPath = `${pathPrefix}_audio.mp3`;
                await this.downloadAndPrepareAudio(commands.audio.id, commands.audio.volume, audioPath);

                await ffmpegUtils.combineVideoAndAudio(videoPath, audioPath, finalVideoPath, this, commands.video.volume, commands.audio.volume);
                await fsPromises.unlink(videoPath);
                await fsPromises.unlink(audioPath);
                return finalVideoPath;
            } else {
                await fsPromises.rename(videoPath, finalVideoPath);
                return finalVideoPath;
            }
        } else if(commands.audio){
            if(!commands.image){
                throw new Error("Paragraph doesnt have a visual source");
            }
            let audioPath = `${pathPrefix}_audio.mp3`;
            await this.downloadAndPrepareAudio(commands.audio.id, commands.audio.volume, audioPath);

            let imageURL = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            let imagePath = `${pathPrefix}_image.png`;
            await fileSys.downloadData(imageURL, imagePath);

            await ffmpegUtils.createVideoFromAudioAndImage(finalVideoPath, audioPath, commands.audio.duration, imagePath, this);
            await fsPromises.unlink(audioPath);
            return finalVideoPath;
        }else if(commands.silence){
            if(!commands.image){
                throw new Error("Paragraph doesnt have a visual source");
            }

            let imageURL = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            let imagePath = `${pathPrefix}_image.png`;
            await fileSys.downloadData(imageURL, imagePath);
            await ffmpegUtils.createVideoFromImage(finalVideoPath, imagePath, commands.silence.duration, this);
            return finalVideoPath;
        } else if(commands.image){
            let imagePath = `${pathPrefix}_image.png`;
            let imageURL = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            await fileSys.downloadData(imageURL, imagePath);
            await ffmpegUtils.createVideoFromImage(finalVideoPath, imagePath, 1, this);
            await fsPromises.unlink(imagePath);
            return finalVideoPath;
        }
    }

    async downloadAndPrepareAudio(audioId, volume, path){
        let audioURL = await Storage.getDownloadURL(Storage.fileTypes.audios, audioId);
        await fileSys.downloadData(audioURL, path);
        await ffmpegUtils.verifyMediaFileIntegrity(path, this);
        await ffmpegUtils.verifyAudioSettings(path, this);
        await ffmpegUtils.adjustAudioVolume(path, volume, this);
    }

    async attachEffectsToParagraphVideo(videoPath, effects, effectsPathPrefix){
        if(!effects){
            return;
        }
        for(let effect of effects){
            let effectPath = `${effectsPathPrefix}_effect_${effect.id}.mp3`;
            let effectURL = await Storage.getDownloadURL(Storage.fileTypes.audios, effect.id);
            await fileSys.downloadData(effectURL, effectPath);
            await ffmpegUtils.verifyMediaFileIntegrity(effectPath, this);
            await ffmpegUtils.verifyAudioSettings(effectPath, this);
            await ffmpegUtils.trimAudioAdjustVolume(effectPath, effect.start, effect.end, effect.volume, this);
            effect.path = effectPath;
        }
        await ffmpegUtils.addEffectsToVideo(effects, videoPath, this);
        for(let effect of effects){
            await fsPromises.unlink(effect.path);
            delete effect.path;
        }
    }
    async getRelevantInfo() {
        if (this.status === STATUS.RUNNING) {
            return `Creating video for document ${this.document.title}`;
        }
        if (this.status === STATUS.FAILED) {
            return this.failMessage;
        }
        if (this.status === STATUS.COMPLETED) {
            return `Video created for document ${this.document.title}`;
        }
    }
}
module.exports = DocumentToVideo;
