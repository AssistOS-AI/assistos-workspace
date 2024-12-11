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
        // if(chapter.commands.compileVideo){
        //     try {
        //         await fsPromises.access(outputVideoPath);
        //     } catch (e){
        //         let url = await Storage.getDownloadURL(Storage.fileTypes.videos, chapter.commands.compileVideo.id);
        //         await fileSys.downloadData(url, outputVideoPath);
        //         await ffmpegUtils.verifyMediaFileIntegrity(outputVideoPath, documentTask);
        //         await ffmpegUtils.verifyVideoSettings(outputVideoPath, documentTask);
        //     }
        //     return outputVideoPath;
        // }
        let failedTasks = [];
        for(let i = 0; i < chapter.paragraphs.length; i++){
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
            throw new Error(`Failed to create videos for chapter ${chapterIndex} paragraphs: ${failedTasks.join(", ")}`);
        }
        completedFramePaths = completedFramePaths.filter(videoPath => typeof videoPath !== "undefined");

        try {
            await ffmpegUtils.combineVideos(
                pathPrefix,
                completedFramePaths,
                `chapter_${chapterIndex}_frames.txt`,
                outputVideoPath,
                documentTask);
        } catch (e){
            throw new Error(`Failed to combine videos for chapter ${chapterIndex}: ${e}`);
        }

        if(chapter.backgroundSound){
            try {
                let chapterAudioPath = path.join(pathPrefix, `background_sound.mp3`);
                let chapterAudioURL = await Storage.getDownloadURL(Storage.fileTypes.audios, chapter.backgroundSound.id);
                await fileSys.downloadData(chapterAudioURL, chapterAudioPath);
                await ffmpegUtils.addBackgroundSoundToVideo(outputVideoPath, chapterAudioPath, chapter.backgroundSound.volume, chapter.backgroundSound.loop, documentTask);
                await fsPromises.unlink(chapterAudioPath);
            } catch (e) {
                throw new Error(`Failed to add background sound to chapter ${chapterIndex}: ${e}`);
            }
        }
        //await this.uploadFinalVideo(outputVideoPath);
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
