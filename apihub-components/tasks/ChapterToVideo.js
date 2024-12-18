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
const {exec} = require("child_process");
const TaskManager = require("./TaskManager");
const space = require("../spaces-storage/space");
class ChapterToVideo extends Task {
    constructor(spaceId, userId, configs) {
        super(spaceId, userId);
        this.documentId = configs.documentId;
        this.chapterId = configs.chapterId;
        this.workingDir = configs.workingDir;
        this.documentTaskId = configs.documentTaskId;
        this.processes = [];
    }
    async runTask(){
        let chapter;
        let pathPrefix;
        let chapterIndex = "";
        let documentModule = await this.loadModule("document");
        if(!this.documentTaskId){
            chapter = await documentModule.getChapter(this.spaceId, this.documentId, this.chapterId);
            const spacePath = space.APIs.getSpacePath(this.spaceId);
            this.workingDir = path.join(spacePath, "temp", `${this.constructor.name}_${this.id}_temp`);
            pathPrefix = this.workingDir;
            await fsPromises.mkdir(this.workingDir, {recursive: true});
        } else {
            let TaskManager = require('./TaskManager');
            let documentTask = TaskManager.getTask(this.documentTaskId);
            chapter = documentTask.document.chapters.find(chapter => chapter.id === this.chapterId);
            chapterIndex = documentTask.document.chapters.indexOf(chapter);
            pathPrefix = path.join(this.workingDir, `chapter_${chapterIndex}`);
            await fsPromises.mkdir(pathPrefix, {recursive: true});
        }

        this.chapter = chapter;
        let completedFramePaths = [];

        let outputVideoPath = path.join(pathPrefix, `video.mp4`);
        if(chapter.commands.compileVideo){
            if(chapter.commands.compileVideo.id){
                this.logInfo(`Found compiled video for chapter ${chapterIndex}`);
                try {
                    await fsPromises.access(outputVideoPath);
                } catch (e){
                    this.logProgress(`Downloading compiled video for chapter ${chapterIndex}`);
                    let url = await Storage.getDownloadURL(Storage.fileTypes.videos, chapter.commands.compileVideo.id);
                    await fileSys.downloadData(url, outputVideoPath);
                    this.logProgress(`Verifying compiled video file integrity for chapter ${chapterIndex}`);
                    await ffmpegUtils.verifyMediaFileIntegrity(outputVideoPath, this);
                    this.logProgress(`Verifying compiled video settings for chapter ${chapterIndex}`);
                    await ffmpegUtils.verifyVideoSettings(outputVideoPath, this);
                }
                return outputVideoPath;
            }
        }
        let failedTasks = [];
        for(let i = 0; i < chapter.paragraphs.length; i++){
            this.logInfo(`Creating video for paragraph ${i}`);
            try{
                let paragraph = chapter.paragraphs[i];
                let paragraphTask = new ParagraphToVideo(this.spaceId, this.userId, {
                    documentId: this.documentId,
                    chapterId: this.chapterId,
                    paragraphId: paragraph.id,
                    workingDir: pathPrefix,
                    chapterTaskId: this.id
                });
                await TaskManager.addTask(paragraphTask);
                let objectId = SubscriptionManager.getObjectId(this.documentId, "tasksList");
                SubscriptionManager.notifyClients("", objectId, {id: paragraphTask.id, action: "add"});
                let videoPath = await paragraphTask.run();
                completedFramePaths.push(videoPath);
            } catch (e) {
                failedTasks.push(i);
            }
        }
        if(failedTasks.length > 0){
            delete this.chapter.commands.compileVideo;
            await documentModule.updateChapterCommands(this.spaceId, this.documentId, this.chapterId, this.chapter.commands);
            await fsPromises.rm(pathPrefix, {recursive: true, force: true});
            this.logError(`Failed to create videos for chapter ${chapterIndex} paragraphs: ${failedTasks.join(", ")}`, {finished: true});
            throw new Error(`Failed to create videos for chapter ${chapterIndex} paragraphs: ${failedTasks.join(", ")}`);
        }
        completedFramePaths = completedFramePaths.filter(videoPath => typeof videoPath !== "undefined");
        this.logInfo(`Combining videos for chapter ${chapterIndex}`);
        try {
            await ffmpegUtils.combineVideos(
                pathPrefix,
                completedFramePaths,
                `chapter_${chapterIndex}_frames.txt`,
                outputVideoPath,
                this);
        } catch (e){
            delete this.chapter.commands.compileVideo;
            await documentModule.updateChapterCommands(this.spaceId, this.documentId, this.chapterId, this.chapter.commands);
            this.logError(`Failed to combine videos for chapter ${chapterIndex}: ${e}`, {finished: true});
            throw new Error(`Failed to combine videos for chapter ${chapterIndex}: ${e}`);
        }

        if(chapter.backgroundSound){
            this.logInfo(`Found background sound for chapter ${chapterIndex}`);
            try {
                this.logProgress(`Downloading background sound for chapter ${chapterIndex}`);
                let chapterAudioPath = path.join(pathPrefix, `background_sound.mp3`);
                let chapterAudioURL = await Storage.getDownloadURL(Storage.fileTypes.audios, chapter.backgroundSound.id);
                await fileSys.downloadData(chapterAudioURL, chapterAudioPath);
                this.logProgress(`Verifying background sound file integrity for chapter ${chapterIndex}`);
                await ffmpegUtils.verifyMediaFileIntegrity(chapterAudioPath, this);
                this.logProgress(`Verifying background sound settings for chapter ${chapterIndex}`);
                await ffmpegUtils.verifyAudioSettings(chapterAudioPath, this);
                this.logProgress(`Adding background sound to chapter ${chapterIndex}`);
                await ffmpegUtils.addBackgroundSoundToVideo(outputVideoPath, chapterAudioPath, chapter.backgroundSound.volume, chapter.backgroundSound.loop, this);
                await fsPromises.unlink(chapterAudioPath);
            } catch (e) {
                delete this.chapter.commands.compileVideo;
                await documentModule.updateChapterCommands(this.spaceId, this.documentId, this.chapterId, this.chapter.commands);
                this.logError(`Failed to add background sound to chapter ${chapterIndex}: ${e}`, {finished: true});
                throw new Error(`Failed to add background sound to chapter ${chapterIndex}: ${e}`);
            }
        }
        await this.uploadFinalVideo(outputVideoPath);
        this.logSuccess(`Video created for chapter ${chapterIndex}`);
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
        if(!this.documentTaskId){
            await fsPromises.rm(this.workingDir, {recursive: true, force: true});
        }
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
    async cancelTask(){
        for(let process of this.processes){
            process.kill();
        }
        if(!this.documentTaskId){
            await fsPromises.rm(this.workingDir, {recursive: true, force: true});
        }
        delete this.chapter.commands.compileVideo;
        let documentModule = await this.loadModule("document");
        await documentModule.updateChapterCommands(this.spaceId, this.documentId, this.chapterId, this.chapter.commands);
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
    async getRelevantInfo() {
        if (this.status === STATUS.FAILED) {
            return this.failMessage;
        } else return "Creating video for chapter";
    }
}
module.exports = ChapterToVideo;
