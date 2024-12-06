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
        let pathPrefix = path.join(this.workingDir, `chapter_${this.chapterIndex}`);
        await fsPromises.mkdir(pathPrefix, {recursive: true});
        for(let i = 0; i < chapter.paragraphs.length; i++){
            try{
                let paragraphTask = new ParagraphToVideo(this.spaceId, this.userId, {
                    documentId: this.documentId,
                    chapterId: this.chapterId,
                    paragraphId: chapter.paragraphs[i].id,
                    workingDir: this.workingDir,
                    documentTaskId: this.documentTaskId
                });
                await TaskManager.addTask(paragraphTask);
                let videoPath = await paragraphTask.run();
                completedFramePaths.push(videoPath);
            } catch (e) {
                throw new Error(`Failed to create video for chapter ${chapterIndex}, paragraph ${i}: ${e}`);
            }
        }
        completedFramePaths = completedFramePaths.filter(videoPath => typeof videoPath !== "undefined");
        let outputVideoPath = `${pathPrefix}_video.mp4`;
        await ffmpegUtils.combineVideos(
            this.workingDir,
            completedFramePaths,
            `chapter_${chapterIndex}_frames.txt`,
            outputVideoPath,
            documentTask);
        if(chapter.backgroundSound){
            let chapterAudioPath = `${pathPrefix}_audio.mp3`;
            let chapterAudioURL = await Storage.getDownloadURL(Storage.fileTypes.audios, chapter.backgroundSound.id);
            await fileSys.downloadData(chapterAudioURL, chapterAudioPath);
            await ffmpegUtils.addBackgroundSoundToVideo(outputVideoPath, chapterAudioPath, chapter.backgroundSound.volume, chapter.backgroundSound.loop, documentTask);
            await fsPromises.unlink(chapterAudioPath);
        }
        return outputVideoPath;
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
