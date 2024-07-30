const path = require('path');
const fsPromises = require('fs').promises;
const file = require('./file.js');
const {exec} = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const space = require("../spaces-storage/space.js").APIs;
const Task = require('./Task.js');
const TaskManager = require('./TaskManager.js');
function runFfmpeg(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout || stderr);
        });
    });
}

async function concatenateAudioFiles(tempVideoDir, audioFilesPaths, outputAudioPath, fileName) {
    const fileListPath = path.join(tempVideoDir, fileName);
    const fileListContent = audioFilesPaths.map(file => `file '${file}'`).join('\n');
    await fsPromises.writeFile(fileListPath, fileListContent);
    const command = `${ffmpegPath} -f concat -safe 0 -i ${fileListPath} -c copy ${outputAudioPath}`;
    await runFfmpeg(command);
    await fsPromises.unlink(fileListPath);
}

async function createVideoFromImage(image, duration, outputVideoPath) {
    const command = `${ffmpegPath} -loop 1 -i ${image} -c:v libx264 -t ${duration} -pix_fmt yuv420p ${outputVideoPath}`;
    await runFfmpeg(command);
}
async function combineVideoAndAudio(videoPath, audioPath, outputPath) {
    const command = `${ffmpegPath} -i ${videoPath} -i ${audioPath} -c:v copy -c:a aac -strict experimental ${outputPath}`;
    await runFfmpeg(command);
}
function splitChapterIntoFrames(spacePath, chapter, chapterIndex) {
    let chapterFrames = [];
    const audiosPath = path.join(spacePath, 'audios');
    const imagesPath = path.join(spacePath, 'images');
    let frame = {
        imagePath: "",
        audiosPath: [],
    };
    for (let paragraph of chapter.paragraphs) {
        if (paragraph.image) {
            frame = {
                imagePath: "",
                audiosPath: [],
            };
            frame.imagePath = path.join(imagesPath, `${paragraph.image.src.split("/").pop()}.png`);
            chapterFrames.push(frame);
        } else if (paragraph.audio) {
            if(!frame.imagePath) {
                throw new Error(`Audio paragraph without image in chapter ${chapterIndex}`);
            }
            let audioPath = path.join(audiosPath, `${paragraph.audio.src.split("/").pop()}.mp3`);
            frame.audiosPath.push(audioPath);
        }
    }
    return chapterFrames;
}
async function createChapterVideo(chapter, tempVideoDir, documentId, chapterIndex, spacePath, parentTask){
    let completedFramePaths = [];
    let chapterFrames = splitChapterIntoFrames(spacePath, chapter, chapterIndex);
    if(chapterFrames.length === 0) {
        return;
    }
    let tasks = chapterFrames.map((frame, index) => new Task(async ()=>{
        return await createVideoFrame(frame, tempVideoDir, documentId, chapterIndex, index);
    }));
    let promises = [];
    for(let task of tasks) {
        parentTask.addChildTask(task);
        promises.push(task.run());
    }
    function wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    await wait(10000);
    try{
        completedFramePaths = await Promise.all(promises);
    } catch (e) {
        await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
        throw new Error(`Failed to create video frames for chapter ${chapterIndex}: ${e}`);
    }
    return combineVideos(tempVideoDir, completedFramePaths, `chapter_${chapterIndex}_frames.txt`, `chapter_${chapterIndex}_video.mp4`);
}
async function combineVideos(tempVideoDir, videoPaths, fileListName, outputVideoName, videoDir) {
    const fileListPath = path.join(tempVideoDir, fileListName);
    const fileListContent = videoPaths.map(file => `file '${file}'`).join('\n');
    await fsPromises.writeFile(fileListPath, fileListContent);
    let videoPath;
    if(videoDir){
        videoPath = path.join(videoDir, outputVideoName);
    } else {
        videoPath = path.join(tempVideoDir, outputVideoName);
    }
    const command = `${ffmpegPath} -f concat -safe 0 -i ${fileListPath} -c copy ${videoPath}`;
    await runFfmpeg(command);
    await fsPromises.unlink(fileListPath);
    return videoPath;
}
async function documentToVideo(spaceId, document, userId, videoId) {
    const spacePath = space.getSpacePath(spaceId);
    const tempVideoDir = path.join(spacePath, "videos", `${videoId}_temp`);
    await file.createDirectory(tempVideoDir);
    let tasks = document.chapters.map((chapter, index) => {
        let task = new Task(async ()=>{
            return await createChapterVideo(chapter, tempVideoDir, document.id, index, spacePath, task)
        })
        return task;
    });
    let parentTask = TaskManager.getTask(videoId);
    let promises = [];
    for(let task of tasks) {
        parentTask.addChildTask(task);
        promises.push(task.run());
    }
    let chapterVideos = [];
    try {
        chapterVideos = await Promise.all(promises);
    } catch (e) {
        await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
        throw new Error(`Failed to concatenate chapter videos: ${e}`);
    }
    try {
        let videoPath = await combineVideos(tempVideoDir, chapterVideos, `chapter_videos.txt`, `${videoId}.mp4`, path.join(spacePath, "videos"));
        await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
        return videoPath;
    } catch (e) {
        await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
        throw new Error(`Failed to combine chapter videos: ${e}`);
    }
}
async function createVideoFrame(frame, tempVideoDir, documentId, chapterIndex, frameIndex){
    const audioPath = path.join(tempVideoDir, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_audio.mp3`);
    const videoPath = path.join(tempVideoDir, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_video.mp4`);
    if(frame.audiosPath.length === 0) {
        throw new Error(`No audio files for chapter ${chapterIndex} frame ${frameIndex}`);
    }
    await concatenateAudioFiles(tempVideoDir, frame.audiosPath, audioPath, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_audios.txt`);
    let audioDuration;
    audioDuration = (await runFfmpeg(`${ffmpegPath} -i ${audioPath} -hide_banner 2>&1 | grep "Duration"`)).match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
    const totalDuration = parseInt(audioDuration[1]) * 3600 + parseInt(audioDuration[2]) * 60 + parseFloat(audioDuration[3]);
    await createVideoFromImage(frame.imagePath, totalDuration, videoPath);
    let combinedPath = path.join(tempVideoDir, `chapter_${chapterIndex}_frame_${frameIndex}_combined.mp4`);
    await combineVideoAndAudio(videoPath, audioPath, combinedPath);
    return combinedPath;
}
module.exports = {
    documentToVideo
}