const {exec, spawn} = require("child_process");
const fs = require('fs');
const Task = require('./Task');
const path = require('path');
const fsPromises = fs.promises;
const space = require('../spaces-storage/space');
const ffmpegUtils = require("../apihub-component-utils/ffmpeg");
const constants = require('./constants');
const STATUS = constants.STATUS;
const ChapterToVideo = require('./ChapterToVideo');
const SubscriptionManager = require("../subscribers/SubscriptionManager");
class DocumentToVideo extends Task {
    constructor(spaceId, userId, configs) {
        super(spaceId, userId);
        this.processes = [];
        this.documentId = configs.documentId;
        //TODO: gather all errors and return them in the end
    }
    async runTask(){
        const spacePath = space.APIs.getSpacePath(this.spaceId);
        let tempVideoDir = path.join(spacePath, "temp", `${this.id}_temp`);
        await fsPromises.mkdir(tempVideoDir, {recursive: true});
        const documentModule = await this.loadModule("document", this.securityContext);
        this.document = await documentModule.getDocument(this.spaceId, this.documentId);
        let TaskManager = require('./TaskManager');
        let chapterVideos = [];
        let failedTasks = [];
        for(let i = 0; i < this.document.chapters.length; i++){
            let chapter = this.document.chapters[i];
            let chapterTask = new ChapterToVideo(this.spaceId, this.userId, {
                documentId: this.documentId,
                chapterId: chapter.id,
                workingDir: tempVideoDir,
                documentTaskId: this.id
            });
            await TaskManager.addTask(chapterTask);
            let objectId = SubscriptionManager.getObjectId(chapterTask.spaceId, "tasksList");
            SubscriptionManager.notifyClients("", objectId, {id: chapterTask.id, action: "add"});
            try {
                let videoPath = await chapterTask.run();
                chapterVideos.push(videoPath);
            } catch (e) {
                failedTasks.push(i);
            }
        }
        if(failedTasks.length > 0){
            for(let process of this.processes){
                     process.kill();
            }
            await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
            throw new Error(`Failed to create videos for chapters: ${failedTasks.join(", ")}`);
        }
        chapterVideos = chapterVideos.filter(videoPath => typeof videoPath !== "undefined");
        try {
            let videoPath = path.join(spacePath, "temp", `${this.id}.mp4`);
            await ffmpegUtils.combineVideos(
                tempVideoDir,
                chapterVideos,
                `chapter_videos.txt`,
                videoPath,
                this);
            await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
            return `/documents/video/${this.spaceId}/${this.id}`;
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
        setTimeout(() => {
            const TaskManager = require('./TaskManager');
            TaskManager.removeTask(this.id);
        }, 5000);
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
            }
        }
    }
    async createChapterVideo(chapter, tempVideoDir){

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
