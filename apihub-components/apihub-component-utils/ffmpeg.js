const path = require('path');
const fsPromises = require('fs').promises;
const file = require('./file.js');
const ffmpegPath = require("ffmpeg-static");
const space = require("../spaces-storage/space.js").APIs;
const Task = require('./Task.js');
const utilsModule = require("assistos").loadModule("util",{});
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
    //duration is in seconds
    const command = `${ffmpegPath} -f lavfi -t ${duration} -i anullsrc=r=24000:cl=mono -c:a libmp3lame -b:a 160k ${outputPath}`
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
    const command = `${ffmpegPath} -i ${videoPath} -i ${audioPath} -c:v copy -c:a aac -f matroska pipe:1`;
    //const command = `${ffmpegPath} -i ${videoPath} -i ${audioPath} -c:v copy -c:a aac -strict experimental -f mp4 pipe:1`;
    await task.streamCommandToFile(command, outputPath);
}
async function splitChapterIntoFrames(tempVideoDir, spaceId, documentId, chapter, task) {
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
            let audioSrc= paragraph.audio.src;
            let audioPath = path.join(audiosPath, `${audioSrc.split("/").pop()}.mp3`);
            frame.audiosPath.push(audioPath);
        } else{
            let audioPath = await tryToExecuteCommandOnParagraph(tempVideoDir, spaceId, documentId, paragraph, task);
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
async function tryToExecuteCommandOnParagraph(tempVideoDir, spaceId, documentId, paragraph, task) {
    let commandObject = utilsModule.findCommand(paragraph.text);
    let taskFunction;
    if(commandObject.action === "textToSpeech"){
        const spacePath = space.getSpacePath(spaceId);
        const audiosPath = path.join(spacePath, 'audios');
        taskFunction = async function(){
            let audioId = await audioCommands.executeTextToSpeechOnParagraph(spaceId, documentId, paragraph, commandObject, this);
            return path.join(audiosPath, `${audioId}.mp3`);
        }
    } else if(commandObject.action === "createSilentAudio"){
        taskFunction = async function(){
            let audioPath = path.join(tempVideoDir, `${documentId}_paragraph_${paragraph.id}_silent.mp3`);
            await createSilentAudio(audioPath, commandObject.paramsObject.duration, this);
            return audioPath;
        }
    } else {
        return;
    }
    let childTask = new Task(taskFunction, task.securityContext);
    try {
        task.addChildTask(childTask);
        return await childTask.run();
    } catch (e) {
        //throw new Error(`Failed to execute command on paragraph ${paragraph.id}: ${e}`);
        //command failed, stop video creation?
    }
}
async function addBackgroundSoundToVideo(videoPath, backgroundSoundPath, backgroundSoundVolume, fadeDuration, outputPath, task) {
    //backgroundSoundVolume is a float between 0 and 1
    //backgroundSound fades out at the end of the video
    backgroundSoundVolume = Math.max(0, Math.min(1, backgroundSoundVolume));
    let videoDurationOutput= await task.runCommand(`${ffmpegPath} -i ${videoPath} 2>&1 | grep "Duration"`);
    const videoDurationMatch = videoDurationOutput.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
    if (!videoDurationMatch) {
        throw new Error('Could not determine video duration');
    }
    const videoDuration =
        parseInt(videoDurationMatch[1]) * 3600 +
        parseInt(videoDurationMatch[2]) * 60 +
        parseFloat(videoDurationMatch[3]);
    // Ensure fadeDuration does not exceed videoDuration
    fadeDuration = Math.min(fadeDuration, videoDuration);
    const fadeOutStartTime = videoDuration - fadeDuration;
    const tempOutputPath = path.join(path.dirname(outputPath), `temp_${path.basename(outputPath)}`);
    const command = `${ffmpegPath} -i ${videoPath} -i ${backgroundSoundPath} -filter_complex "
            [1:a]volume=${backgroundSoundVolume},afade=t=out:st=${fadeOutStartTime}:d=${fadeDuration}[bk];
            [0:a][bk]amix=inputs=2:duration=first[aout]
            " -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k ${tempOutputPath}`;
    await task.runCommand(command);
    await fsPromises.unlink(outputPath);
    await fsPromises.rename(tempOutputPath, outputPath);
}
async function createChapterVideo(spaceId, chapter, tempVideoDir, documentId, chapterIndex, task){
    let completedFramePaths = [];
    let chapterFrames = await splitChapterIntoFrames(tempVideoDir, spaceId, documentId, chapter, task);
    if(chapterFrames.length === 0) {
        return;
    }
    let childTasks = chapterFrames.map((frame, index) => new Task(async function (){
        return await createVideoFrame(frame, tempVideoDir, documentId, chapterIndex, index, this);
    }, task.securityContext));
    let promises = [];
    try{
        for(let childTask of childTasks) {
            task.addChildTask(childTask);
            let frame = await childTask.run();
            completedFramePaths.push(frame);
        }
    } catch (e) {
        throw new Error(`Failed to create video frames for chapter ${chapterIndex}: ${e}`);
    }
    let videoPath = await combineVideos(
        tempVideoDir,
        completedFramePaths,
        `chapter_${chapterIndex}_frames.txt`,
        `chapter_${chapterIndex}_video.mkv`,
        task);
    if(chapter.backgroundSound){
        let backgroundSoundPath = path.join(space.getSpacePath(spaceId), 'audios', `${chapter.backgroundSound.src.split("/").pop()}.mp3`);
        let outputVideoPath = path.join(tempVideoDir, `chapter_${chapterIndex}_video.mp4`);
        await addBackgroundSoundToVideo(videoPath, backgroundSoundPath, chapter.backgroundSound.volume, 1, outputVideoPath, task);
    }
    return videoPath;
}
async function combineVideos(tempVideoDir, videoPaths, fileListName, outputVideoName, task, videoDir) {
    const fileListPath = path.join(tempVideoDir, fileListName);
    const fileListContent = videoPaths.map(file => `file '${file}'`).join('\n');
    await fsPromises.writeFile(fileListPath, fileListContent);
    let outputVideoPath;
    if(videoDir){
        outputVideoPath = path.join(videoDir, outputVideoName);
    } else {
        outputVideoPath = path.join(tempVideoDir, outputVideoName);
    }
    const command = `${ffmpegPath} -f concat -safe 0 -i ${fileListPath} -filter_complex "[0:a]aresample=async=1[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -f matroska pipe:1`;
    await task.streamCommandToFile(command, outputVideoPath);
    await fsPromises.unlink(fileListPath);

    return outputVideoPath;
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
    chapterVideos = chapterVideos.filter(videoPath => typeof videoPath !== "undefined")
    try {
        let videoPath = await combineVideos(
            tempVideoDir,
            chapterVideos,
            `chapter_videos.txt`,
            `${task.id}.mkv`,
            task,
            path.join(spacePath, "videos"));
        let mp4VideoPath = videoPath.replace('.mkv', '.mp4');
        const convertCommand = `"${ffmpegPath}" -i "${videoPath}" -c:v copy -c:a copy "${mp4VideoPath}"`;
        await task.runCommand(convertCommand);
        await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
        await fsPromises.unlink(videoPath);
        return mp4VideoPath;
    } catch (e) {
        await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
        throw new Error(`Failed to combine chapter videos: ${e}`);
    }
}
async function createVideoFrame(frame, tempVideoDir, documentId, chapterIndex, frameIndex, task){
    let audioPath = path.join(tempVideoDir, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_audio.mp3`);
    const videoPath = path.join(tempVideoDir, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_video.mkv`);
    const defaultDuration = 0.25;
    if(frame.audiosPath.length === 0) {
        audioPath = path.join(tempVideoDir, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_silent.mp3`);
        await createSilentAudio(audioPath, defaultDuration, task);
        await createVideoFromImage(frame.imagePath, defaultDuration, videoPath, task);
        let combinedPath = path.join(tempVideoDir, `chapter_${chapterIndex}_frame_${frameIndex}_combined.mkv`);
        await combineVideoAndAudio(videoPath, audioPath, combinedPath, task);
        return combinedPath;
    }
    await concatenateAudioFiles(tempVideoDir, frame.audiosPath, audioPath, `${documentId}_chapter_${chapterIndex}_frame_${frameIndex}_audios.txt`, task);
    let audioDuration;
    audioDuration = (await task.runCommand(`${ffmpegPath} -i ${audioPath} -hide_banner 2>&1 | grep "Duration"`)).match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
    const totalDuration = parseInt(audioDuration[1]) * 3600 + parseInt(audioDuration[2]) * 60 + parseFloat(audioDuration[3]);
    await createVideoFromImage(frame.imagePath, totalDuration, videoPath, task);
    let combinedPath = path.join(tempVideoDir, `chapter_${chapterIndex}_frame_${frameIndex}_combined.mkv`);
    await combineVideoAndAudio(videoPath, audioPath, combinedPath, task);
    return combinedPath;
}
module.exports = {
    documentToVideo
}