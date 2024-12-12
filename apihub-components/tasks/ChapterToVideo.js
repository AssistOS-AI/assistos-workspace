const fs = require('fs');
const Task = require('./Task');
const path = require('path');
const fsPromises = fs.promises;
const fileSys = require('../apihub-component-utils/fileSys');
const ffmpegUtils = require("../apihub-component-utils/ffmpeg");
const Storage = require("../apihub-component-utils/storage");
const constants = require('./constants');
const STATUS = constants.STATUS;
const ParagraphToVideo = require('./ParagraphToVideo');
const SubscriptionManager = require("../subscribers/SubscriptionManager");
const crypto = require("../apihub-component-utils/crypto");
class ChapterToVideo extends Task {
    constructor(spaceId, userId, configs) {
        super(spaceId, userId);
        this.documentId = configs.documentId;
        this.chapterId = configs.chapterId;
        this.workingDir = configs.workingDir;
        this.documentTaskId = configs.documentTaskId;
    }
    async runTask(){
        let TaskManager = require('./TaskManager');
        let documentTask = TaskManager.getTask(this.documentTaskId);

        let chapter = documentTask.document.chapters.find(chapter => chapter.id === this.chapterId);
        let chapterIndex = documentTask.document.chapters.indexOf(chapter);
        let completedFramePaths = [];
        let pathPrefix = path.join(this.workingDir, `chapter_${chapterIndex}`);
        await fsPromises.mkdir(pathPrefix, {recursive: true});

        let outputVideoPath = path.join(pathPrefix, `video.mp4`);
        if(chapter.commands.compileVideo){
            documentTask.logInfo(`Found compiled video for chapter ${chapterIndex}`);
            try {
                await fsPromises.access(outputVideoPath);
            } catch (e){
                documentTask.logProgress(`Downloading compiled video for chapter ${chapterIndex}`);
                let url = await Storage.getDownloadURL(Storage.fileTypes.videos, chapter.commands.compileVideo.id);
                await fileSys.downloadData(url, outputVideoPath);
                documentTask.logProgress(`Verifying compiled video file integrity for chapter ${chapterIndex}`);
                await ffmpegUtils.verifyMediaFileIntegrity(outputVideoPath, documentTask);
                documentTask.logProgress(`Verifying compiled video settings for chapter ${chapterIndex}`);
                await ffmpegUtils.verifyVideoSettings(outputVideoPath, documentTask);
            }
            return outputVideoPath;
        }
        let failedTasks = [];
        for(let i = 0; i < chapter.paragraphs.length; i++){
            documentTask.logInfo(`Creating video for paragraph ${i}`);
            try{
                let paragraph = chapter.paragraphs[i];
                let paragraphTask = new ParagraphToVideo(this.spaceId, this.userId, {
                    documentId: this.documentId,
                    chapterId: this.chapterId,
                    paragraphId: paragraph.id,
                    workingDir: pathPrefix,
                    documentTaskId: this.documentTaskId
                });
                await TaskManager.addTask(paragraphTask);
                let objectId = SubscriptionManager.getObjectId(paragraphTask.spaceId, "tasksList");
                SubscriptionManager.notifyClients("", objectId, {id: paragraphTask.id, action: "add"});
                let videoPath = await paragraphTask.run();
                completedFramePaths.push(videoPath);
            } catch (e) {
                failedTasks.push(i);
            }
        }
        if(failedTasks.length > 0){
            await fsPromises.rm(pathPrefix, {recursive: true, force: true});
            documentTask.logError(`Failed to create videos for chapter ${chapterIndex} paragraphs: ${failedTasks.join(", ")}`);
            throw new Error(`Failed to create videos for chapter ${chapterIndex} paragraphs: ${failedTasks.join(", ")}`);
        }
        completedFramePaths = completedFramePaths.filter(videoPath => typeof videoPath !== "undefined");
        documentTask.logInfo(`Combining videos for chapter ${chapterIndex}`);
        try {
            await ffmpegUtils.combineVideos(
                pathPrefix,
                completedFramePaths,
                `chapter_${chapterIndex}_frames.txt`,
                outputVideoPath,
                documentTask);
        } catch (e){
            documentTask.logError(`Failed to combine videos for chapter ${chapterIndex}: ${e}`);
            throw new Error(`Failed to combine videos for chapter ${chapterIndex}: ${e}`);
        }

        if(chapter.backgroundSound){
            documentTask.logInfo(`Found background sound for chapter ${chapterIndex}`);
            try {
                documentTask.logProgress(`Downloading background sound for chapter ${chapterIndex}`);
                let chapterAudioPath = path.join(pathPrefix, `background_sound.mp3`);
                let chapterAudioURL = await Storage.getDownloadURL(Storage.fileTypes.audios, chapter.backgroundSound.id);
                await fileSys.downloadData(chapterAudioURL, chapterAudioPath);
                documentTask.logProgress(`Verifying background sound file integrity for chapter ${chapterIndex}`);
                await ffmpegUtils.verifyMediaFileIntegrity(chapterAudioPath, documentTask);
                documentTask.logProgress(`Verifying background sound settings for chapter ${chapterIndex}`);
                await ffmpegUtils.verifyAudioSettings(chapterAudioPath, documentTask);
                documentTask.logProgress(`Adding background sound to chapter ${chapterIndex}`);
                await ffmpegUtils.addBackgroundSoundToVideo(outputVideoPath, chapterAudioPath, chapter.backgroundSound.volume, chapter.backgroundSound.loop, documentTask);
                await fsPromises.unlink(chapterAudioPath);
            } catch (e) {
                documentTask.logError(`Failed to add background sound to chapter ${chapterIndex}: ${e}`);
                throw new Error(`Failed to add background sound to chapter ${chapterIndex}: ${e}`);
            }
        }
        await this.uploadFinalVideo(outputVideoPath);
        documentTask.logSuccess(`Video created for chapter ${chapterIndex}`);
        return outputVideoPath;
    }
    async uploadFinalVideo(videoPath){
        let readStream = fs.createReadStream(videoPath);
        let videoId = crypto.generateId();
        await Storage.putFile(Storage.fileTypes.videos, videoId, readStream);
        let documentModule = await this.loadModule("document");
        let commands = await documentModule.getChapterCommands(this.spaceId, this.documentId, this.chapterId);
        commands.compileVideo = {
            id: videoId
        };
        await documentModule.updateChapterCommands(this.spaceId, this.documentId, this.chapterId, commands);
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
                workingDir: this.workingDir,
                documentTaskId: this.documentTaskId,
            }
        }
    }
    cancelTask(){

    }
    async getRelevantInfo() {
        if (this.status === STATUS.FAILED) {
            return this.failMessage;
        } else return "Creating video for chapter";
    }
}
module.exports = ChapterToVideo;
