const path = require('path');
const fsPromises = require('fs').promises;
const file = require('./file.js');
const ffmpegPath = require("ffmpeg-static");
const space = require("../spaces-storage/space.js").APIs;
const Task = require('./Task.js');
const audioCommands = require('./audioCommands.js');
async function concatenateAudioFiles(tempVideoDir, audioFilesPaths, outputAudioPath, fileName, task) {
    const fileListPath = path.join(tempVideoDir, fileName);
    const fileListContent = audioFilesPaths.map(file => `file '${file}'`).join('\n');
    await fsPromises.writeFile(fileListPath, fileListContent);
    const command = `${ffmpegPath} -f concat -safe 0 -i ${fileListPath} -c copy ${outputAudioPath}`;
    await task.runCommand(command);
    await fsPromises.unlink(fileListPath);
}
async function createSilentAudio(outputPath, duration, task) {
    const command = `${ffmpegPath} -f lavfi -t ${duration} -i anullsrc=r=44100:cl=stereo -q:a 9 -acodec libmp3lame ${outputPath}`;
    await task.runCommand(command);
}
async function createVideoFromImage(image, duration, outputVideoPath, task) {
    let command;
    if (image) {
        // Ensure the image dimensions are divisible by 2
        command = `${ffmpegPath} -loop 1 -i ${image} -vf "scale=ceil(iw/2)*2:ceil(ih/2)*2" -c:v libx264 -t ${duration} -pix_fmt yuv420p ${outputVideoPath}`;
    } else {
        // Generate a black screen with the specified duration
        command = `${ffmpegPath} -f lavfi -i color=c=black:s=1920x1080:d=${duration} -c:v libx264 -pix_fmt yuv420p ${outputVideoPath}`;
    }
    await task.runCommand(command);
}
async function combineVideoAndAudio(videoPath, audioPath, outputPath, task) {
    const command = `${ffmpegPath} -i ${videoPath} -i ${audioPath} -c:v copy -c:a aac -strict experimental ${outputPath}`;
    await task.runCommand(command);
}
async function splitChapterIntoFrames(spaceId, documentId, chapter, task) {
    let chapterFrames = [];
    const spacePath = space.getSpacePath(spaceId);
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
            let audioPath = path.join(audiosPath, `${paragraph.audio.src.split("/").pop()}.mp3`);
            frame.audiosPath.push(audioPath);
        }
        else{
            let commandObject = audioCommands.findCommand(paragraph.text);
            if (commandObject) {
                if(commandObject.action === "textToSpeech"){
                    let childTask = new Task(async function () {
                        return await audioCommands.executeTextToSpeechOnParagraph(spaceId, documentId, paragraph, commandObject, this);
                    }, task.securityContext);
                    try {
                        task.addChildTask(childTask);
                        let audioId = await childTask.run();
                        let audioPath = path.join(audiosPath, `${audioId}.mp3`);
                        frame.audiosPath.push(audioPath);
                    } catch (e) {
                        throw new Error(`Failed to execute command on paragraph ${paragraph.id}: ${e}`);
                        //command failed, stop video creation?
                    }
                }
            }
        }
    }
    if (frame.audiosPath.length > 0 || frame.imagePath) {
        chapterFrames.push(frame);
    }
    return chapterFrames;
}
async function createChapterVideo(spaceId, chapter, tempVideoDir, documentId, chapterIndex, task){
    let completedFramePaths = [];
    let chapterFrames = await splitChapterIntoFrames(spaceId, documentId, chapter, task);
    if(chapterFrames.length === 0) {
        return;
    }
    let childTasks = chapterFrames.map((frame, index) => new Task(async function (){
        return await createVideoFrame(frame, tempVideoDir, documentId, chapterIndex, index, this);
    }, task.securityContext));
    let promises = [];
    for(let childTask of childTasks) {
        task.addChildTask(childTask);
        promises.push(childTask.run());
    }
    try{
        completedFramePaths = await Promise.all(promises);
    } catch (e) {
        throw new Error(`Failed to create video frames for chapter ${chapterIndex}: ${e}`);
    }
    return combineVideos(
        tempVideoDir,
        completedFramePaths,
        `chapter_${chapterIndex}_frames.txt`,
        `chapter_${chapterIndex}_video.mp4`,
        task);
}
async function combineVideos(tempVideoDir, videoPaths, fileListName, outputVideoName, task, videoDir) {
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
    await task.runCommand(command);
    await fsPromises.unlink(fileListPath);
    return videoPath;
}
async function documentToVideo(spaceId, document, userId, task) {
    const spacePath = space.getSpacePath(spaceId);
    const tempVideoDir = path.join(spacePath, "videos", `${task.id}_temp`);
    await file.createDirectory(tempVideoDir);
    let childTasks = document.chapters.map((chapter, index) => {
        return new Task(async function(){
            return await createChapterVideo(spaceId, chapter, tempVideoDir, document.id, index, this)
        }, task.securityContext);
    });
    let promises = [];
    for(let childTask of childTasks) {
        task.addChildTask(childTask);
        promises.push(childTask.run());
    }
    let chapterVideos = [];
    try {
        chapterVideos = await Promise.all(promises);
    } catch (e) {
        await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
        throw new Error(`Failed to create chapter video: ${e}`);
    }
    try {
        let videoPath = await combineVideos(
            tempVideoDir,
            chapterVideos,
            `chapter_videos.txt`,
            `${task.id}.mp4`,
            task,
            path.join(spacePath, "videos"));
        await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
        return videoPath;
    } catch (e) {
        await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
        throw new Error(`Failed to combine chapter videos: ${e}`);
    }
}
async function createVideoFrame(frame, tempVideoDir, documentId, chapterIndex, frameIndex, task){
    let audioPath = path.join(tempVideoDir, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_audio.mp3`);
    const videoPath = path.join(tempVideoDir, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_video.mp4`);
    const defaultDuration = 0.25;
    if(frame.audiosPath.length === 0) {
        audioPath = path.join(tempVideoDir, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_silent.mp3`);
        await createSilentAudio(audioPath, defaultDuration, task);
        await createVideoFromImage(frame.imagePath, defaultDuration, videoPath, task);
        let combinedPath = path.join(tempVideoDir, `chapter_${chapterIndex}_frame_${frameIndex}_combined.mp4`);
        await combineVideoAndAudio(videoPath, audioPath, combinedPath, task);
        return combinedPath;
    }
    await concatenateAudioFiles(tempVideoDir, frame.audiosPath, audioPath, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_audios.txt`, task);
    let audioDuration;
    audioDuration = (await task.runCommand(`${ffmpegPath} -i ${audioPath} -hide_banner 2>&1 | grep "Duration"`)).match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
    const totalDuration = parseInt(audioDuration[1]) * 3600 + parseInt(audioDuration[2]) * 60 + parseFloat(audioDuration[3]);
    await createVideoFromImage(frame.imagePath, totalDuration, videoPath, task);
    let combinedPath = path.join(tempVideoDir, `chapter_${chapterIndex}_frame_${frameIndex}_combined.mp4`);
    await combineVideoAndAudio(videoPath, audioPath, combinedPath, task);
    return combinedPath;
}
module.exports = {
    documentToVideo
}