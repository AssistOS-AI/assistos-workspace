const path = require('path');
const fsPromises = require('fs').promises;
const ffmpegPath = require("../../ffmpeg/packages/ffmpeg-static");
const ffprobePath = require("../../ffmpeg/packages/ffprobe-static");
const space = require("../spaces-storage/space.js").APIs;
const crypto = require("./crypto");
const AnonymousTask = require("../tasks/AnonymousTask");
const { spawn } = require('child_process');
const { Readable } = require('stream');
const { once } = require('events');
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

async function createVideoFromImage(spaceId, image, duration, videoUploadCallback, task) {
    const videoTempId = crypto.generateId(16);
    const outputVideoPath = path.join(space.getSpacePath(spaceId), 'temp', `${videoTempId}.mp4`);
    let command;
    if (image) {
        // Ensure the image dimensions are divisible by 2
        command = `${ffmpegPath} -loop 1 -i ${image} -vf "scale=1920:1080" -c:v libx264 -t ${duration} -pix_fmt yuv420p ${outputVideoPath}`;
    } else {
        // Generate a black screen with the specified duration
        command = `${ffmpegPath} -f lavfi -i color=c=black:s=1920x1080:d=${duration} -c:v libx264 -pix_fmt yuv420p ${outputVideoPath}`;
    }
    await task.runCommand(command);
    const videoBuffer = await fsPromises.readFile(outputVideoPath);
    await fsPromises.rm(outputVideoPath);
    return await videoUploadCallback(videoBuffer);
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
    try {
        const checkCommand = `${ffmpegPath} -v error -i ${tempAudioPath} -f null -`;
        await task.runCommand(checkCommand);
    } catch (e) {
        await fsPromises.unlink(tempAudioPath);
        throw new Error(`Failed to check converted file ${tempAudioPath}: ${e}`);
    }
    await fsPromises.unlink(inputAudioPath);
    await fsPromises.rename(tempAudioPath, inputAudioPath);
}

const videoStandard = {
    codec: 'libx264',      // H.264 codec for video
    audioCodec: 'aac',     // AAC codec for audio
    format: 'mp4',         // MP4 format
    bitRate: 1000,         // Video bitrate in kbps (adjust as necessary)
    audioBitRate: 192,     // Audio bitrate in kbps
    frameRate: 30          // Standard frame rate (adjust as necessary)
};

async function convertVideoToMp4(inputVideoPath, task) {
    const tempVideoPath = inputVideoPath.replace(path.extname(inputVideoPath), '_temp.mp4');
    const conversionCommand = `${ffmpegPath} -i ${inputVideoPath} -c:v ${videoStandard.codec} -b:v ${videoStandard.bitRate}k -r ${videoStandard.frameRate} -c:a ${videoStandard.audioCodec} -b:a ${videoStandard.audioBitRate}k -f ${videoStandard.format} ${tempVideoPath}`;
    try {
        await task.runCommand(conversionCommand);
    } catch (e) {
        throw new Error(`Video conversion failed: ${e.message}`);
    }
    try {
        const checkCommand = `${ffmpegPath} -v error -i ${tempVideoPath} -f null -`;
        await task.runCommand(checkCommand);
    } catch (e) {
        await fsPromises.unlink(tempVideoPath);
        throw new Error(`Failed to check converted file ${tempVideoPath}: ${e}`);
    }
    await fsPromises.unlink(inputVideoPath);
    await fsPromises.rename(tempVideoPath, inputVideoPath);
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

async function verifyAudioSettings(audioPath, task) {
    const infoCommand = `${ffmpegPath} -i ${audioPath} -f null -`;
    let infoOutput = await task.runCommand(infoCommand);
    const parsedOutput = parseFFmpegInfoOutput(infoOutput);
    const needsReencoding = (
        parsedOutput.sampleRate !== audioStandard.sampleRate ||
        parsedOutput.channels !== audioStandard.channels ||
        parsedOutput.bitRate !== audioStandard.bitRate
    );
    if (needsReencoding) {
        await convertAudioToStandard(audioPath, task);
    }
}

async function verifyAudioIntegrity(audioPath, task) {
    const command = `${ffmpegPath} -v error -i ${audioPath} -f null -`;
    await task.runCommand(command);
}

async function addBackgroundSoundToVideo(videoPath, backgroundSoundPath, backgroundSoundVolume, fadeDuration, outputPath, task) {
    await verifyAudioIntegrity(backgroundSoundPath, task);
    await verifyAudioSettings(backgroundSoundPath, task);
    //backgroundSoundVolume is a float between 0 and 1
    //backgroundSound fades out at the end of the video
    backgroundSoundVolume = Math.max(0, Math.min(1, backgroundSoundVolume));
    let videoDurationOutput = await task.runCommand(`${ffmpegPath} -i ${videoPath} 2>&1 | grep "Duration"`);
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
    if (videoDir) {
        outputVideoPath = path.join(videoDir, outputVideoName);
    } else {
        outputVideoPath = path.join(tempVideoDir, outputVideoName);
    }
    const command = `${ffmpegPath} -f concat -safe 0 -i ${fileListPath} -filter_complex "[0:a]aresample=async=1[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -f matroska pipe:1`;
    await task.streamCommandToFile(command, outputVideoPath);
    await fsPromises.unlink(fileListPath);

    return outputVideoPath;
}

async function createVideoFromImageAndAudio(imageSrc, audioSrc, spaceId, securityContext) {
    const spaceModule = require('assistos').loadModule('space', securityContext);
    const audioId = audioSrc.split('/').pop();
    const imageId = imageSrc.split('/').pop();
    const audioBuffer = Buffer.from(await spaceModule.getAudio(spaceId, audioId));
    const imageBuffer = Buffer.from(await spaceModule.getImage(spaceId, imageId));

    const videoUploadCallback = async function (videoBuffer) {
        return await spaceModule.addVideo(spaceId, videoBuffer);
    }
    const taskCallback = async function (){
        const tempAudioId = crypto.generateId(16);
        try {
            await fsPromises.stat(path.join(space.getSpacePath(spaceId), 'temp'))
        } catch (error) {
            await fsPromises.mkdir(path.join(space.getSpacePath(spaceId), 'temp'));
        }
        const tempAudioPath = path.join(space.getSpacePath(spaceId), 'temp', `${tempAudioId}.mp3`);
        await fsPromises.writeFile(tempAudioPath, audioBuffer);
        const audioDuration = (await this.runCommand(`${ffmpegPath} -i ${tempAudioPath} -hide_banner 2>&1 | grep "Duration"`)).match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        const totalDuration = parseInt(audioDuration[1]) * 3600 + parseInt(audioDuration[2]) * 60 + parseFloat(audioDuration[3]);
        await fsPromises.rm(tempAudioPath);
        const tempImageId = crypto.generateId(16);
        const tempImagePath = path.join(space.getSpacePath(spaceId), 'temp', `${tempImageId}.png`);
        await fsPromises.writeFile(tempImagePath, imageBuffer);
        const videoId = await createVideoFromImage(spaceId,tempImagePath, totalDuration, videoUploadCallback, this);
        await fsPromises.rm(tempImagePath);
        return videoId;
    }
    let task = new AnonymousTask(securityContext, taskCallback);
    const videoId = await task.run();

    return videoId;
}

async function estimateChapterVideoLength(spaceId, chapter) {
    let totalDuration = 0;
    for (let paragraph of chapter.paragraphs) {
        if (paragraph.commands.video) {
            totalDuration += parseFloat(paragraph.commands.video.duration);
        } else if (paragraph.commands.audio) {
            totalDuration += parseFloat(paragraph.commands.audio.duration);
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
async function getAudioDuration(audioBuffer) {
    const stream = new Readable();
    stream.push(audioBuffer);
    stream.push(null);
    const ffmpegProcess = spawn(ffmpegPath, [
        '-i', 'pipe:0', // Input from stdin (the buffer)
        '-f', 'null',   // No output file
        '-'             // Output to null
    ]);
    let stderr = '';
    stream.pipe(ffmpegProcess.stdin);
    ffmpegProcess.stderr.on('data', (data) => {
        stderr += data.toString();
    });
    await once(ffmpegProcess, 'close');
    const timeMatches = [...stderr.matchAll(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/g)];
    let latestTime = 0;
    if (timeMatches.length > 0) {
        const lastMatch = timeMatches[timeMatches.length - 1]; // Get the last occurrence

        const hours = parseFloat(lastMatch[1]);
        const minutes = parseFloat(lastMatch[2]);
        const seconds = parseFloat(lastMatch[3]);
        latestTime = hours * 3600 + minutes * 60 + seconds;
        return latestTime;
    } else {
        throw new Error('Could not determine audio duration');
    }
}

async function estimateDocumentVideoLength(spaceId, document) {
    let totalDuration = 0;
    let promises = [];
    for (let chapter of document.chapters) {
        promises.push(estimateChapterVideoLength(spaceId, chapter));
    }
    let chapterDurations = await Promise.all(promises);
    for (let duration of chapterDurations) {
        totalDuration += duration;
    }
    return totalDuration;
}
async function createScreenshotFromVideoRange(videoStream, timeInSeconds) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn( ffmpegPath, [
            '-i', 'pipe:0',                  // Use stdin as the input
            '-ss', `${timeInSeconds}`,       // Time to capture the screenshot
            '-frames:v', '1',                // Capture only one frame
            '-f', 'image2',                  // Force format as image
            '-vcodec', 'png',                // Specify PNG format
            '-update', '1',                  //  Avoid the need for image sequence patterns
            'pipe:1'                         // Output to stdout
        ]);
        let imageBuffer = [];
        let errorData = '';
        ffmpeg.stdin.on('error', (err) => {
            reject(new Error(`Stdin error: ${err.message}`));
        });
        ffmpeg.stderr.on('data', (data) => {
            errorData += data.toString();
        });
        ffmpeg.stdout.on('data', (buffer) => {
            imageBuffer.push(buffer);
        });
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                if (imageBuffer.length > 0) {
                    let concatBuffer = Buffer.concat(imageBuffer);
                    resolve(concatBuffer);
                } else {
                    reject(new Error('FFmpeg completed but no image data was generated.'));
                }
            } else {
                reject(new Error(`FFmpeg process exited with code ${code}: ${errorData}`));
            }
        });
        ffmpeg.on('error', (err) => {
            reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
        });
        videoStream.pipe(ffmpeg.stdin);
    });
}
async function getImageDimensions(imageBuffer) {
    return new Promise((resolve, reject) => {
        const ffprobe = spawn(ffprobePath, [
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height',
            '-of', 'json',
            'pipe:0' // Input via stdin
        ]);

        let ffprobeOutput = '';
        let errorData = '';

        ffprobe.stdin.write(imageBuffer);
        ffprobe.stdin.end();
        ffprobe.stdout.on('data', (data) => {
            ffprobeOutput += data.toString();
        });
        ffprobe.stderr.on('data', (data) => {
            errorData += data.toString();
        });
        ffprobe.on('close', (code) => {
            if (code === 0) {
                try {
                    const metadata = JSON.parse(ffprobeOutput);
                    const width = metadata.streams[0].width;
                    const height = metadata.streams[0].height;
                    resolve({ width, height });
                } catch (err) {
                    reject(new Error(`Error parsing ffprobe output: ${err.message}`));
                }
            } else {
                reject(new Error(`ffprobe exited with code ${code}: ${errorData}`));
            }
        });
    });
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
    verifyAudioSettings,
    convertVideoToMp4,
    getAudioDuration,
    createScreenshotFromVideoRange,
    getImageDimensions
}
