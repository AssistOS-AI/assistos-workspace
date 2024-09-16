const {exec, spawn} = require("child_process");
const fs = require('fs');
const Task = require('./Task');
const path = require('path');
const fsPromises = fs.promises;
const file = require('../apihub-component-utils/file');
const space = require('../spaces-storage/space');
const ffmpegPath = require("../../ffmpeg/packages/ffmpeg-static");
const audioCommands = require("../apihub-component-utils/audioCommands");
const ffmpegUtils = require("../apihub-component-utils/ffmpeg");
class DocumentToVideo extends Task {
    constructor(securityContext, spaceId, userId, configs) {
        super(securityContext, spaceId, userId);
        this.processes = [];
        this.spaceId = configs.spaceId;
        this.documentId = configs.documentId;
        //TODO: gather all errors and return them in the end
    }
    async runTask(){
        const spacePath = space.APIs.getSpacePath(this.spaceId);
        let tempVideoDir = path.join(spacePath, "videos", `${this.id}_temp`);
        await file.createDirectory(tempVideoDir);
        let promises = [];
        const documentModule = require("assistos").loadModule("document", this.securityContext);
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
        let videoURL = `/spaces/video/${this.spaceId}/${this.id}`;
        if (this.document.video) {
            const videoId = document.video.split("/").pop();
            try {
                await space.APIs.deleteVideo(this.spaceId, videoId);
            } catch (e) {
                //previous video not found
            }
        }
        await documentModule.updateVideo(this.spaceId, this.documentId, videoURL);
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
                if (error) {
                    reject(stderr || error.message);
                    return;
                }
                resolve(stdout || stderr);
            });
            this.processes.push(childProcess);
        });
    }
    async streamCommandToFile(command, outputPath) {
        return new Promise( (resolve, reject) => {
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
        });
    }
    serialize() {
        return{
            id: this.id,
            status: this.status,
            securityContext: this.securityContext,
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
        let chapterFrames = await this.splitChapterIntoFrames(tempVideoDir, spaceId, documentId, chapter);
        if(chapterFrames.length === 0) {
            return;
        }
        let completedFramePaths = [];
        try{
            let promises = chapterFrames.map(async (frame, index) => {
                    return await this.createVideoFrame(frame, tempVideoDir, documentId, chapterIndex, index);
            });
            completedFramePaths = await Promise.all(promises);
        } catch (e) {
            throw new Error(`Failed to create video frames for chapter ${chapterIndex}: ${e}`);
        }
        let videoPath = await ffmpegUtils.combineVideos(
            tempVideoDir,
            completedFramePaths,
            `chapter_${chapterIndex}_frames.txt`,
            `chapter_${chapterIndex}_video.mkv`,
            this);
        if(chapter.backgroundSound){
            let backgroundSoundPath = path.join(space.APIs.getSpacePath(spaceId), 'audios', `${chapter.backgroundSound.src.split("/").pop()}.mp3`);
            let outputVideoPath = path.join(tempVideoDir, `chapter_${chapterIndex}_video.mp4`);
            await ffmpegUtils.addBackgroundSoundToVideo(videoPath, backgroundSoundPath, chapter.backgroundSound.volume, 1, outputVideoPath, this);
        }
        return videoPath;
    }

    async splitChapterIntoFrames(tempVideoDir, spaceId, documentId, chapter) {
        let chapterFrames = [];
        const spacePath = space.APIs.getSpacePath(spaceId);
        const audiosPath = path.join(spacePath, 'audios');
        const imagesPath = path.join(spacePath, 'images');
        let frame = {
            imagePath: "",
            audiosPath: [],
        };
        for (let paragraph of chapter.paragraphs) {
            if (paragraph.image) {
                if (frame.audiosPath.length > 0 || frame.imagePath) {
                    chapterFrames.push(frame);
                }
                frame = {
                    imagePath: path.join(imagesPath, `${paragraph.image.src.split("/").pop()}.png`),
                    audiosPath: [],
                };
            } else if (paragraph.audio) {
                let audioSrc= paragraph.audio.src;
                let audioPath = path.join(audiosPath, `${audioSrc.split("/").pop()}.mp3`);
                //check audio integrity + convert to standard
                try {
                    await ffmpegUtils.verifyAudioIntegrity(audioPath, this);
                    await ffmpegUtils.verifyAudioSettings(audioPath, this);
                    frame.audiosPath.push(audioPath);
                } catch (e){
                    console.error(e);
                }
            } else{
                let audioPath = await this.tryToExecuteCommandOnParagraph(tempVideoDir, spaceId, documentId, paragraph);
                if(audioPath){
                    frame.audiosPath.push(audioPath);
                }
            }
        }
        if (frame.audiosPath.length > 0 || frame.imagePath) {
            chapterFrames.push(frame);
        }
        return chapterFrames;
    }
    async tryToExecuteCommandOnParagraph(tempVideoDir, spaceId, documentId, paragraph) {
        let commandObject = paragraph.commands;
        let chapterIndex = this.document.chapters.findIndex(chapter => chapter.paragraphs.includes(paragraph));
        let paragraphIndex = this.document.chapters[chapterIndex].paragraphs.findIndex(p => p === paragraph);
        if(commandObject.action === "textToSpeech"){
            try {
                const spacePath = space.APIs.getSpacePath(spaceId);
                const audiosPath = path.join(spacePath, 'audios');
                let audioId = await audioCommands.executeTextToSpeechOnParagraph(spaceId, documentId, paragraph, commandObject, this);
                let audioPath = path.join(audiosPath, `${audioId}.mp3`);
                //check audio integrity + convert to standard
                await ffmpegUtils.verifyAudioIntegrity(audioPath, this);
                await ffmpegUtils.verifyAudioSettings(audioPath, this);
                return audioPath;
            }catch (e){
                console.error(`Failed to execute text to speech on chapter ${chapterIndex} paragraph ${paragraphIndex}: ${e}`);
            }

        } else if(commandObject.action === "createSilentAudio"){
            try {
                let audioPath = path.join(tempVideoDir, `${documentId}_paragraph_${paragraph.id}_silent.mp3`);
                await ffmpegUtils.createSilentAudio(audioPath, commandObject.paramsObject.duration, this);
                return audioPath;
            } catch (e) {
                console.error(`Failed to create silent audio chapter ${chapterIndex} paragraph ${paragraphIndex}: ${e}`);
            }
        }
    }
    async createVideoFrame(frame, tempVideoDir, documentId, chapterIndex, frameIndex){
        let audioPath = path.join(tempVideoDir, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_audio.mp3`);
        const videoPath = path.join(tempVideoDir, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_video.mkv`);
        const defaultDuration = 0.25;
        if(frame.audiosPath.length === 0) {
            audioPath = path.join(tempVideoDir, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_silent.mp3`);
            await ffmpegUtils.createSilentAudio(audioPath, defaultDuration, this);
            await ffmpegUtils.createVideoFromImage(frame.imagePath, defaultDuration, videoPath, this);
            let combinedPath = path.join(tempVideoDir, `chapter_${chapterIndex}_frame_${frameIndex}_combined.mkv`);
            await ffmpegUtils.combineVideoAndAudio(videoPath, audioPath, combinedPath, this);
            return combinedPath;
        }
        await ffmpegUtils.concatenateAudioFiles(tempVideoDir, frame.audiosPath, audioPath, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_audios.txt`, this);
        let audioDuration;
        audioDuration = (await this.runCommand(`${ffmpegPath} -i ${audioPath} -hide_banner 2>&1 | grep "Duration"`)).match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        const totalDuration = parseInt(audioDuration[1]) * 3600 + parseInt(audioDuration[2]) * 60 + parseFloat(audioDuration[3]);
        await ffmpegUtils.createVideoFromImage(frame.imagePath, totalDuration, videoPath, this);
        let combinedPath = path.join(tempVideoDir, `chapter_${chapterIndex}_frame_${frameIndex}_combined.mkv`);
        await ffmpegUtils.combineVideoAndAudio(videoPath, audioPath, combinedPath, this);
        return combinedPath;
    }
}
module.exports = DocumentToVideo;
