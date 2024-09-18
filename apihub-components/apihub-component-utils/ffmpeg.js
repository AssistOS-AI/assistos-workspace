const path = require('path');
const fsPromises = require('fs').promises;
const ffmpegPath = require("../../ffmpeg/packages/ffmpeg-static");
const ffprobePath = require("../../ffmpeg/packages/ffprobe-static");
const space = require("../spaces-storage/space.js").APIs;
const crypto = require("./crypto");
const AnonymousTask = require("../tasks/AnonymousTask");
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
    const command = `${ffmpegPath} -f lavfi -t ${duration} -i anullsrc=r=44100:cl=stereo -c:a libmp3lame -b:a 192k ${outputPath}`;
    await task.runCommand(command);
}
async function createVideoFromImage(image, duration, outputVideoPath, task) {
    let command;
    if (image) {
        // Ensure the image dimensions are divisible by 2
        command = `${ffmpegPath} -loop 1 -i ${image} -vf "scale=1920:1080" -c:v libx264 -t ${duration} -pix_fmt yuv420p ${outputVideoPath}`;
    } else {
        // Generate a black screen with the specified duration
        command = `${ffmpegPath} -f lavfi -i color=c=black:s=1920x1080:d=${duration} -c:v libx264 -pix_fmt yuv420p ${outputVideoPath}`;
    }
    await task.runCommand(command);
}
async function combineVideoAndAudio(videoPath, audioPath, outputPath, task) {
    const command = `${ffmpegPath} -i ${videoPath} -i ${audioPath} -c:v copy -c:a aac -f matroska pipe:1`;
    await task.streamCommandToFile(command, outputPath);
}
const audioStandard = {
    sampleRate: 44100,
    channels: 2, //stereo
    bitRate: 192,
    codec: 'mp3'
}
async function convertAudioToStandard(inputAudioPath, task) {
    let tempAudioPath = inputAudioPath.replace('.mp3', '_temp.mp3');
    const command = `${ffmpegPath} -i ${inputAudioPath} -ar ${audioStandard.sampleRate} -ac ${audioStandard.channels} -ab ${audioStandard.bitRate}k -f ${audioStandard.codec} ${tempAudioPath}`;
    await task.runCommand(command);

    //check audio integrity
    try{
        const checkCommand = `${ffmpegPath} -v error -i ${tempAudioPath} -f null -`;
        await task.runCommand(checkCommand);
    } catch (e) {
        await fsPromises.unlink(tempAudioPath);
        throw new Error(`Failed to check converted file ${tempAudioPath}: ${e}`);
    }
    await fsPromises.unlink(inputAudioPath);
    await fsPromises.rename(tempAudioPath, inputAudioPath);
}
function parseFFmpegInfoOutput(output) {
    const result = {};
    const streamPattern = /Stream #\d+:\d+.*Audio:\s*([^\s,]+),\s*(\d+) Hz,\s*(mono|stereo|5\.1|7\.1|quad|surround),.*?,\s*(\d+) kb\/s/;
    const streamMatch = output.match(streamPattern);
    const channelMapping = {
        "mono": 1,
        "stereo": 2,
        "5.1": 6,
        "7.1": 8,
        "quad": 4,
        "surround": 5
    };
    if (streamMatch) {
        result.codec = streamMatch[1];
        result.sampleRate = parseInt(streamMatch[2]);
        result.bitRate = parseInt(streamMatch[4]);
        result.channels = channelMapping[streamMatch[3]] || 0;
    }
    return result;
}
async function verifyAudioSettings(audioPath, task){
    const infoCommand = `${ffmpegPath} -i ${audioPath} -f null -`;
    let infoOutput = await task.runCommand(infoCommand);
    const parsedOutput = parseFFmpegInfoOutput(infoOutput);
    const needsReencoding = (
        parsedOutput.sampleRate !== audioStandard.sampleRate ||
        parsedOutput.channels !== audioStandard.channels ||
        parsedOutput.bitRate !== audioStandard.bitRate
    );
    if(needsReencoding){
        await convertAudioToStandard(audioPath, task);
    }
}
async function verifyAudioIntegrity(audioPath, task){
    const command = `${ffmpegPath} -v error -i ${audioPath} -f null -`;
    await task.runCommand(command);
}

async function addBackgroundSoundToVideo(videoPath, backgroundSoundPath, backgroundSoundVolume, fadeDuration, outputPath, task) {
    await verifyAudioIntegrity(backgroundSoundPath, task);
    await verifyAudioSettings(backgroundSoundPath, task);
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
async function createVideoFromImageAndAudio(imageSrc,audioSrc,spaceId){
    const videoId = crypto.generateId();
    const audioId = audioSrc.split('/').pop().split('.')[0];
    const imageId = imageSrc.split('/').pop().split('.')[0];
    const audioPath = space.getSpacePath(spaceId) + `/audios/${audioId}.mp3`;
    const imagePath = space.getSpacePath(spaceId) + `/images/${imageId}.png`;
    const videoPath = space.getSpacePath(spaceId) + `/videos/${videoId}.mp4`;

    let task = new AnonymousTask({},async function () {
        const audioDuration = (await this.runCommand(`${ffmpegPath} -i ${audioPath} -hide_banner 2>&1 | grep "Duration"`)).match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        const totalDuration = parseInt(audioDuration[1]) * 3600 + parseInt(audioDuration[2]) * 60 + parseFloat(audioDuration[3]);
        await createVideoFromImage(imagePath, totalDuration,videoPath,this);
    });
    await task.run();

    return videoId;
}
async function estimateChapterVideoLength(spaceId, chapter, task){
    let totalDuration = 0;
    for (let paragraph of chapter.paragraphs) {
        if (paragraph.commands.audio) {
            let audioPath = path.join(space.getSpacePath(spaceId), 'audios', `${paragraph.commands.audio.src.split("/").pop()}.mp3`);
            const command = `${ffprobePath} -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`;
            let duration = await task.runCommand(command);
            totalDuration += parseFloat(duration);
        } else if (paragraph.commands["silence"]) {
            if (paragraph.commands["silence"].paramsObject.duration) {
                totalDuration += parseFloat(paragraph.commands["silence"].paramsObject.duration);
            }
        } else if (paragraph.commands.image) {
            totalDuration += 1;
        }
    }
    return totalDuration;
}
async function estimateDocumentVideoLength(spaceId, document, task){
    let totalDuration = 0;
    let promises = [];
    for(let chapter of document.chapters){
        promises.push(estimateChapterVideoLength(spaceId, chapter, task));
    }
    let chapterDurations = await Promise.all(promises);
    for(let duration of chapterDurations){
        totalDuration += duration;
    }
    return totalDuration;
}
module.exports = {
    createVideoFromImage,
    combineVideoAndAudio,
    createVideoFromImageAndAudio,
    estimateDocumentVideoLength,
    combineVideos,
    concatenateAudioFiles,
    createSilentAudio,
    addBackgroundSoundToVideo,
    verifyAudioIntegrity,
    verifyAudioSettings
}
