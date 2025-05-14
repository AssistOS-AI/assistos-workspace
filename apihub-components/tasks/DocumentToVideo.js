const {exec} = require("child_process");
const fs = require('fs');
const Task = require('./Task');
const path = require('path');
const fsPromises = fs.promises;
const constants = require('./constants');
const STATUS = constants.STATUS;
const ChapterToVideo = require('./ChapterToVideo');
const SubscriptionManager = require("../subscribers/SubscriptionManager");
class DocumentToVideo extends Task {
    constructor(spaceId, userId, configs) {
        super(spaceId, userId);
        this.processes = [];
        this.documentId = configs.documentId;
        this.chapterTaskIds = [];
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
        this.logInfo(`Creating video for document ${this.document.title}`);
        for(let i = 0; i < this.document.chapters.length; i++){
            let chapter = this.document.chapters[i];
            let chapterTask = new ChapterToVideo(this.spaceId, this.userId, {
                documentId: this.documentId,
                chapterId: chapter.id,
                workingDir: tempVideoDir,
                documentTaskId: this.id
            });
            this.logInfo(`Creating video for chapter ${i}`, {taskId: chapterTask.id});
            await TaskManager.addTask(chapterTask);
            this.chapterTaskIds.push(chapterTask.id);
            let objectId = SubscriptionManager.getObjectId(this.documentId, "tasksList");
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
            this.logError(`Failed to create videos for chapters: ${failedTasks.join(", ")}`, {finished: true});
            throw new Error(`Failed to create videos for chapters: ${failedTasks.join(", ")}`);
        }
        chapterVideos = chapterVideos.filter(videoPath => typeof videoPath !== "undefined");
        try {
            this.logInfo(`Combining chapter videos`);
            let videoPath = path.join(spacePath, "temp", `${this.id}.mp4`);
            const ffmpegUtils = require("../apihub-component-utils/ffmpeg");
            await ffmpegUtils.combineVideos(
                tempVideoDir,
                chapterVideos,
                `chapter_videos.txt`,
                videoPath,
                this);

            let baseURL;
            if (configs.ENVIRONMENT_MODE === "production") {
                baseURL = configs.PRODUCTION_BASE_URL;
            } else {
                baseURL = configs.DEVELOPMENT_BASE_URL;
            }
            this.logSuccess(`Video created. URL: ${baseURL}/documents/video/${this.spaceId}/${this.id}` ,{finished: true});
            await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
            return `/documents/video/${this.spaceId}/${this.id}`;
        } catch (e) {
            await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
            for(let process of this.processes){
                process.kill();
            }
            this.logError(`Failed to combine chapter videos: ${e}`, {finished: true});
            throw new Error(`Failed to combine chapter videos: ${e}`);
        }
    }
    async cancelTask(){
        let TaskManager = require('./TaskManager');
        for(let process of this.processes){
            process.kill();
        }
        for(let chapterTaskId of this.chapterTaskIds){
            let chapterTask = TaskManager.getTask(chapterTaskId);
            chapterTask.cancel();
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
            failMessage: this.failMessage,
            configs:{
                spaceId: this.spaceId,
                documentId: this.documentId,
            }
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
