const {exec, spawn} = require("child_process");
const fs = require('fs');
const Task = require('./Task');
const path = require('path');
const fsPromises = fs.promises;
const fileSys = require('../apihub-component-utils/fileSys');
const space = require('../spaces-storage/space');
const ffmpegPath = require("../../ffmpeg/packages/ffmpeg-static");
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
            throw new Error(`Failed to create chapter video: ${e}`);
        }
        chapterVideos = chapterVideos.filter(videoPath => typeof videoPath !== "undefined")
        try {
            let videoPath = await ffmpegUtils.combineVideos(
                tempVideoDir,
                chapterVideos,
                `chapter_videos.txt`,
                `${this.id}.mkv`,
                this,
                path.join(spacePath, "videos"));
            let mp4VideoPath = videoPath.replace('.mkv', '.mp4');
            const convertCommand = `"${ffmpegPath}" -i "${videoPath}" -c:v copy -c:a copy "${mp4VideoPath}"`;
            await this.runCommand(convertCommand);

            await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
            await fsPromises.unlink(videoPath);
        } catch (e) {
            await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
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
    createChildProcess(command, outputPath, resolve, reject) {
        const childProcess = spawn(command, { shell: true });
        this.processes.push(childProcess);
        const outputStream = fs.createWriteStream(outputPath);

        outputStream.on('error', (err) => {
            childProcess.kill();
            reject(`Error writing to file: ${err.message}`);
        });
        childProcess.on('error', (err) => {
            outputStream.close();
            reject(`Failed to start command: ${err.message}`);
        });
        childProcess.stdout.pipe(outputStream);
        let errorMessages = '';
        childProcess.stderr.on('data', (data) => {
            errorMessages += data.toString();
        });
        childProcess.on('close', (code) => {
            if (code !== 0) {
                reject(errorMessages);
            }
            resolve();
        });
        return childProcess;
    }
    async streamCommandToFile(command, outputPath) {
        return new Promise( (resolve, reject) => {
            this.createChildProcess(command, outputPath, resolve, reject);
        });
    }
    // async downloadAndExecuteCommand(url, command, outputPath) {
    //     return new Promise((resolve, reject) => {
    //         // Start the FFmpeg process
    //         let childProcess = this.createChildProcess(command, outputPath, resolve, reject);
    //         http.get(url, (response) => {
    //             response.pipe(childProcess.stdin); // Pipe downloaded file to FFmpeg
    //         }).on('error', (err) => {
    //             reject(new Error(`Error downloading file: ${err.message}`));
    //         });
    //     });
    // }
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
                //await this.attachEffectsToParagraphVideo(videoPath, paragraph.commands, `${pathPrefix}_paragraph_${index}`);
                completedFramePaths.push(videoPath);
            } catch (e) {
                throw new Error(`Failed to create video for chapter ${chapterIndex}, paragraph ${i}: ${e}`);
            }
        }
        completedFramePaths = completedFramePaths.filter(videoPath => typeof videoPath !== "undefined")
        let videoPath = await ffmpegUtils.combineVideos(
            tempVideoDir,
            completedFramePaths,
            `chapter_${chapterIndex}_frames.txt`,
            `chapter_${chapterIndex}_video.mkv`,
            this);
        if(chapter.backgroundSound){
            let tempChapterAudioPath = path.join(tempVideoDir, `chapter_${chapterIndex}_audio.mp3`);
            let chapterAudioURL = await Storage.getDownloadURL(Storage.fileTypes.audios, chapter.backgroundSound.id);
            await fileSys.downloadData(chapterAudioURL, tempChapterAudioPath);
            let outputVideoPath = path.join(tempVideoDir, `chapter_${chapterIndex}_video.mp4`);
            await ffmpegUtils.addBackgroundSoundToVideo(videoPath, tempChapterAudioPath, chapter.backgroundSound.volume, 1, outputVideoPath, this);
        }
        return videoPath;
    }

    async createBaseParagraphVideo(paragraph, pathPrefix){
        let audioPath = `${pathPrefix}_audio.mp3`;
        const videoPath = `${pathPrefix}_video.mkv`;

        let commands = paragraph.commands;
        if(commands.video){
            let videoURL = await Storage.getDownloadURL(Storage.fileTypes.videos, commands.video.id);
            await fileSys.downloadData(videoURL, videoPath);
            await ffmpegUtils.verifyVideoSettings(videoPath, this);
            if(commands.audio){
                let audioURL = await Storage.getDownloadURL(Storage.fileTypes.audios, commands.audio.id);
                await fileSys.downloadData(audioURL, audioPath);

                await ffmpegUtils.verifyAudioIntegrity(audioPath, this);
                await ffmpegUtils.verifyAudioSettings(audioPath, this);

                let combinedPath = `${pathPrefix}_combined.mkv`;
                await ffmpegUtils.combineVideoAndAudio(videoPath, commands.video.duration, audioPath, commands.audio.duration, combinedPath, this);
                await fsPromises.unlink(videoPath);
                await fsPromises.unlink(audioPath);
                return combinedPath;
            } else {
                return videoPath;
            }
        } else if(commands.audio){
            let audioURL = await Storage.getDownloadURL(Storage.fileTypes.audios, commands.audio.id);
            await fileSys.downloadData(audioURL, audioPath);
            await ffmpegUtils.createVideoFromAudio(videoPath, audioPath, this);
            await fsPromises.unlink(audioPath);
            return videoPath;
        }else if(commands.silence){
            await ffmpegUtils.createVideoFromImage(videoPath, "", commands.silence.duration, this);
            return videoPath;
        } else if(commands.image){
            let imagePath = `${pathPrefix}_image.png`;
            let imageURL = await Storage.getDownloadURL(Storage.fileTypes.images, commands.image.id);
            await fileSys.downloadData(imageURL, imagePath);
            await ffmpegUtils.createVideoFromImage(videoPath, "", 1, this);
            await fsPromises.unlink(imagePath);
            return videoPath;
        }
    }
    async attachEffectsToParagraphVideo(videoPath, commands, effectsPathPrefix){
        if(!commands.effects){
            return;
        }
        for(let effect of commands.effects){
            let effectPath = path.join(effectsPathPrefix, `_effect_${effect.id}.mp3`);
            let effectURL = await Storage.getDownloadURL(Storage.fileTypes.audios, effect.id);
            await fileSys.downloadData(effectURL, effectPath);
            await ffmpegUtils.addEffectToVideo(videoPath, tempVideoPath, effect.start, effect.end, effect.volume, outputVideoPath, this);
            videoPath = outputVideoPath;
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
