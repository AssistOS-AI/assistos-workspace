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
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
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
    const command = `${ffmpegPath} -f lavfi -t ${duration} -i anullsrc=r=${audioStandard.sampleRate}:cl=stereo -c:a ${audioStandard.codec} -b:a ${audioStandard.bitRate}k ${outputPath}`;
    await task.runCommand(command);
}

async function createVideoFromImage(outputVideoPath, imagePath, duration, task) {
    let command;
    if (imagePath) {
        // Ensure the image dimensions are divisible by 2
        command = `${ffmpegPath} -loop 1 -i ${imagePath} \
        -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=${audioStandard.sampleRate} \
        -vf "scale=${videoStandard.width}:${videoStandard.height},setsar=${videoStandard.SAR}" \
        -r ${videoStandard.frameRate} -t ${duration} -shortest -c:v ${videoStandard.codec} -pix_fmt yuv420p  \
        -c:a ${audioStandard.codec} ${outputVideoPath}`;

    } else {
        // Generate a black screen with the specified duration
        command = `${ffmpegPath} -f lavfi -i color=c=black:s=${videoStandard.width}x${videoStandard.height}:d=${duration} \
        -f lavfi -t ${duration} -i anullsrc=channel_layout=stereo:sample_rate=${audioStandard.sampleRate} \
        -vf "setsar=${videoStandard.SAR}" -r ${videoStandard.frameRate} -shortest -c:v ${videoStandard.codec} -pix_fmt yuv420p -c:a ${audioStandard.codec} ${outputVideoPath}`;

    }
    await task.runCommand(command);
}

async function hasAudioStream(videoPath, task) {
    const ffprobeCommand = `${ffprobePath} -i "${videoPath}" -show_streams -select_streams a -loglevel error`;
    let result = await task.runCommand(ffprobeCommand);
    return result.includes('codec_type=audio');
}

async function combineVideoAndAudio(videoPath, audioPath, outputPath, task, videoVolume, audioVolume) {
    let command = '';
    let hasAudio = await hasAudioStream(videoPath, task);
    videoVolume = volumeToDecibels(videoVolume);
    audioVolume = volumeToDecibels(audioVolume);
    const videoVolumeFilter = `[0:a]volume=${videoVolume}dB[videoAudio];`;
    const audioVolumeFilter = `[1:a]volume=${audioVolume}dB[externalAudio];`;
    if(hasAudio){
        command = `${ffmpegPath} -i ${videoPath} -i ${audioPath} -filter_complex "${videoVolumeFilter}${audioVolumeFilter}[videoAudio][externalAudio]amix=inputs=2:duration=first:dropout_transition=2" -c:v copy -c:a ${audioStandard.codec} ${outputPath}`;
    } else {
        command = `${ffmpegPath} -i ${videoPath} -i ${audioPath} -filter_complex "${audioVolumeFilter}" -map 0:v -map [externalAudio] -c:v copy -c:a ${audioStandard.codec} ${outputPath}`;
    }
    await task.runCommand(command);
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
    format: 'mp4',         // MP4 format
    //bitRate: 10000,         // Video bitrate in kbps
    frameRate: 30,          // Standard frame rate
    width: 1920,
    height: 1080,
    SAR: '1:1',
    //DAR: '16:9'
};
const audioStandard = {
    sampleRate: 44100,
    channels: 2, //stereo
    bitRate: 192, //in kbps
    codec: 'mp3'
}
async function convertVideoToStandard(inputVideoPath, task) {
    const tempVideoPath = inputVideoPath.replace(path.extname(inputVideoPath), '_temp.mp4');
    const conversionCommand = `${ffmpegPath} -i ${inputVideoPath} \
    -c:v ${videoStandard.codec} -r ${videoStandard.frameRate} \
    -s ${videoStandard.width}x${videoStandard.height} -vf "setsar=${videoStandard.SAR}" \
    -ar ${audioStandard.sampleRate} -ac ${audioStandard.channels} -c:a ${audioStandard.codec} -b:a ${audioStandard.bitRate}k \
    -f ${videoStandard.format} ${tempVideoPath}`;
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

async function verifyAudioSettings(audioPath, task) {
    const command = `${ffprobePath} -v quiet -print_format json -show_format -show_streams "${audioPath}"`;
    let result = await task.runCommand(command);
    const metadata = JSON.parse(result);
    const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
    if (needsAudioConversion(audioStream)) {
        await convertAudioToStandard(audioPath, task);
        return true;
    }
    return false;
}
function needsAudioConversion(audioStreamInfo) {
    return audioStreamInfo && (
        audioStreamInfo.codec_name !== audioStandard.codec ||
        parseInt(audioStreamInfo.sample_rate) !== audioStandard.sampleRate ||
        audioStreamInfo.channels !== audioStandard.channels ||
        parseFloat(audioStreamInfo.bit_rate)/1000 !== audioStandard.bitRate
    );
}

async function addAudioStreamToVideo(videoPath, task){
    const tempOutputPath = videoPath.replace('.mp4', '_temp.mp4');
    const command = `${ffmpegPath} -i ${videoPath} -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=${audioStandard.sampleRate} \
    -c:v copy -c:a ${audioStandard.codec} -b:a ${audioStandard.bitRate}k -shortest ${tempOutputPath}`;
    try {
        await task.runCommand(command);
    } catch (e) {
        throw new Error(`Failed to add audio stream to video: ${e.message}`);
    }
    await fsPromises.unlink(videoPath);
    await fsPromises.rename(tempOutputPath, videoPath);
}

async function verifyVideoSettings(videoPath, task){
    const command = `${ffprobePath} -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
    let result = await task.runCommand(command);
    const metadata = JSON.parse(result);
    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
    const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

    const needsVideoConversion =
        videoStream.codec_name !== "h264" ||
        !metadata.format.format_name.split(",").includes(videoStandard.format) ||
        //parseFloat(videoStream.bit_rate) !== videoStandard.bitRate * 1000 ||
        videoStream.avg_frame_rate.split('/').reduce((a, b) => a / b) !== videoStandard.frameRate ||
        videoStream.width !== videoStandard.width ||
        videoStream.height !== videoStandard.height ||
        videoStream.sample_aspect_ratio !== videoStandard.SAR
    if(!audioStream){
        await addAudioStreamToVideo(videoPath, task);
    }
    if (needsVideoConversion || needsAudioConversion(audioStream)) {
        await convertVideoToStandard(videoPath, task);
        return true;
    }
    return false;
}
async function verifyMediaFileIntegrity(filePath, task) {
    const command = `${ffmpegPath} -v error -i ${filePath} -f null -`;
    await task.runCommand(command);
}
async function getVideoDuration(videoPath){
    const { stdout, stderr } = await execFileAsync(ffmpegPath, ['-i', videoPath, '-f', 'null', '-']);
    const durationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/);
    if (!durationMatch) {
        throw new Error('Could not parse the video duration');
    }

    // Convert duration (hh:mm:ss.ss) to seconds
    const hours = parseFloat(durationMatch[1]);
    const minutes = parseFloat(durationMatch[2]);
    const seconds = parseFloat(durationMatch[3]);
    // Round to one decimal place
    return hours * 3600 + minutes * 60 + seconds;
}
async function addBackgroundSoundToVideo(videoPath, backgroundSoundPath, backgroundSoundVolume, loop, task) {
    let videoDuration = await getVideoDuration(videoPath);
    const tempOutputPath = videoPath.replace('.mp4', '_temp.mp4');
    let loopOption = loop ? "-stream_loop -1" : "";
    const fadeDuration = 2;
    backgroundSoundVolume = volumeToDecibels(backgroundSoundVolume);
    const command = `${ffmpegPath} ${loopOption} -i ${backgroundSoundPath} -i ${videoPath} \
    -filter_complex "[0:a]afade=t=in:st=0:d=${fadeDuration},afade=t=out:st=${videoDuration-2}:d=${fadeDuration},volume=${backgroundSoundVolume}dB[bg]; \
    [1:a][bg]amix=inputs=2:duration=longest[aout]" \
    -map 1:v -map "[aout]" -c:v copy -c:a ${audioStandard.codec} -t ${videoDuration} ${tempOutputPath}`;

    await task.runCommand(command);
    await fsPromises.unlink(videoPath);
    await fsPromises.rename(tempOutputPath, videoPath);
}

async function adjustVideoVolume(videoPath, volume, task) {
    const tempOutputPath = videoPath.replace('.mp4', '_temp.mp4');
    volume = volumeToDecibels(volume);
    const command = `${ffmpegPath} -i ${videoPath} -af "volume=${volume}dB" -c:v copy -c:a ${audioStandard.codec} ${tempOutputPath}`;
    await task.runCommand(command);
    await fsPromises.unlink(videoPath);
    await fsPromises.rename(tempOutputPath, videoPath);
}

async function adjustAudioVolume(audioPath, volume, task) {
    const tempOutputPath = audioPath.replace('.mp3', '_temp.mp3');
    volume = volumeToDecibels(volume);
    const command = `${ffmpegPath} -i ${audioPath} -af "volume=${volume}dB" -c:a ${audioStandard.codec} ${tempOutputPath}`;
    await task.runCommand(command);
    await fsPromises.unlink(audioPath);
    await fsPromises.rename(tempOutputPath, audioPath);
}

function volumeToDecibels(volume) {
    if (volume < 0 || volume > 100) {
        throw new Error("Volume must be between 0 and 1");
    }

    if (volume === 0) {
        return "-Infinity"; // Silence: 0 volume maps to -Infinity dB
    }

    const decibels = 20 * Math.log10(volume/100);
    return decibels.toFixed(2);
}
async function combineVideos(tempVideoDir, videoPaths, fileListName, outputVideoPath, task) {
    if(videoPaths.length === 1){
        await fsPromises.rename(videoPaths[0], outputVideoPath);
        return;
    }

    let videoBatches = [];
    const batchSize = 10;
    for (let i = 0; i < videoPaths.length; i += batchSize) {
        videoBatches.push(videoPaths.slice(i, i + batchSize));
    }
    let intermediateFiles = [];
    for (let i = 0; i < videoBatches.length; i++) {
        task.logProgress(`---Processing video batch ${i}/${videoBatches.length}`);
        let batch = videoBatches[i];
        const fileListPath = path.join(tempVideoDir, fileListName);
        const fileListContent = batch.map(file => `file '${file}'`).join('\n');
        await fsPromises.writeFile(fileListPath, fileListContent);

        const intermediateOutput = path.join(tempVideoDir, `batch_${i}_${crypto.generateId(8)}.mp4`);
        intermediateFiles.push(intermediateOutput);

        // Run FFmpeg command to concatenate the batch
        const command = `${ffmpegPath} -f concat -safe 0 -i ${fileListPath} \
        -fflags +genpts -filter_complex "[0:v]setpts=PTS-STARTPTS[v];[0:a]aresample=async=1[a]" \
        -map "[v]" -map "[a]" -c:v ${videoStandard.codec} -c:a ${audioStandard.codec} -crf 18 ${intermediateOutput}`;
        await task.runCommand(command);

        // Clean up the temporary file list
        await fsPromises.unlink(fileListPath);
    }

    if (intermediateFiles.length > batchSize) {
        task.logProgress(`---Batches exceed maximum size ${batchSize}, calling combineVideos recursively`);
        return combineVideos(ffmpegPath, tempVideoDir, intermediateFiles, 'finalFileList.txt', outputVideoPath, task);
    }

    if(intermediateFiles.length === 1){
        await fsPromises.rename(intermediateFiles[0], outputVideoPath);
        return;
    }

    task.logProgress('---Concatenating batches');
    // After processing all batches, concatenate the intermediate files into the final output
    const intermediateFileList = intermediateFiles.map(file => `file '${file}'`).join('\n');
    const finalFileListPath = path.join(tempVideoDir, 'finalFileList.txt');
    await fsPromises.writeFile(finalFileListPath, intermediateFileList);

    // Run FFmpeg command to concatenate all intermediate files into the final output
    const finalCommand = `${ffmpegPath} -f concat -safe 0 -i ${finalFileListPath} \
    -fflags +genpts -filter_complex "[0:v]setpts=PTS-STARTPTS[v];[0:a]aresample=async=1[a]" \
    -map "[v]" -map "[a]" -c:v ${videoStandard.codec} -c:a ${audioStandard.codec} -crf 18 ${outputVideoPath}`;
    await task.runCommand(finalCommand);

    // Clean up the final file list and intermediate files
    task.logProgress('---Cleaning up');
    await fsPromises.unlink(finalFileListPath);
    for (const intermediateFile of intermediateFiles) {
        await fsPromises.unlink(intermediateFile);
    }
}

async function createVideoFromImageAndAudio(imageBuffer, audioDuration, spaceId) {
    const taskCallback = async function (){
        try {
            await fsPromises.stat(path.join(space.getSpacePath(spaceId), 'temp'))
        } catch (error) {
            await fsPromises.mkdir(path.join(space.getSpacePath(spaceId), 'temp'));
        }
        const tempImageId = crypto.generateId(16);
        const tempImagePath = path.join(space.getSpacePath(spaceId), 'temp', `${tempImageId}.png`);
        await fsPromises.writeFile(tempImagePath, imageBuffer);
        let outputVideoPath = path.join(space.getSpacePath(spaceId), 'temp', `${tempImageId}.mp4`);
        await createVideoFromImage(outputVideoPath, tempImagePath, audioDuration, this);
        const spaceModule = await this.loadModule('space');
        let videoBuffer = await fsPromises.readFile(outputVideoPath);
        let videoId = await spaceModule.putVideo(videoBuffer);
        await fsPromises.rm(tempImagePath);
        return videoId;
    }
    let task = new AnonymousTask(taskCallback);
    try {
        const videoId = await task.run();
        return videoId;
    } catch (e) {
        throw new Error(`Failed to create video from image and audio: ${e.message}`);
    }
}
//preserve original aspect ratio but pad to fit the standard dimensions
async function createVideoFromAudioAndImage(outputVideoPath, audioPath, imagePath, task) {
    let audioDuration = await getAudioDuration(audioPath, task);
    const command = `${ffmpegPath} -loop 1 -framerate ${videoStandard.frameRate} -i ${imagePath} -i ${audioPath} \
    -c:v ${videoStandard.codec} -tune stillimage -c:a ${audioStandard.codec} -b:a ${audioStandard.bitRate}k -pix_fmt yuv420p \
    -t ${audioDuration} -vf "fps=${videoStandard.frameRate},format=yuv420p,scale=${videoStandard.width}:${videoStandard.height}:force_original_aspect_ratio=decrease,pad=${videoStandard.width}:${videoStandard.height}:(ow-iw)/2:(oh-ih)/2" ${outputVideoPath}`;
    await task.runCommand(command);
}
async function getAudioDuration(filePath, task){
    const command = `ffmpeg -i ${filePath} 2>&1 | grep "Duration" | awk '{print $2}' | tr -d ,`;
    let result = await task.runCommand(command);
    const [hours, minutes, seconds] = result.split(':').map(Number);
    console.log("------------",hours, minutes, seconds, "------------");
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        throw new Error(`Could not parse the audio duration: ${result}, filePath: ${filePath}`);
    }
    return hours * 3600 + minutes * 60 + seconds;
}
async function trimFileAdjustVolume(filePath, start, end, volume, task) {
    let tempOutputPath = filePath.replace(path.extname(filePath), `_temp${path.extname(filePath)}`);
    volume = volumeToDecibels(volume);
    const command = `${ffmpegPath} -i ${filePath} -ss ${start} -to ${end} -af "volume=${volume}dB" -c:a ${audioStandard.codec} ${tempOutputPath}`;
    await task.runCommand(command);
    await fsPromises.unlink(filePath);
    await fsPromises.rename(tempOutputPath, filePath);
}
async function addEffectsToVideo(effects, videoPath, task) {
    if(!effects.some(effect => effect.path)){
        throw new Error('Effects must have a path');
    }
    const fadeDuration = 2;
    let command = `${ffmpegPath} -i ${videoPath} `;
    for(let effect of effects){
        command += `-i ${effect.path} `;
    }
    command += `-filter_complex "`;
    for(let i = 0; i < effects.length; i++){
        let effect = effects[i];
        command += `[${i+1}]adelay=${effect.playAt * 1000}|${effect.playAt * 1000}`;
        if(effect.fadeIn){
            command += `,afade=t=in:st=0:d=${fadeDuration}`;
        }
        if(effect.fadeOut){
            command += `,afade=t=out:st=${effect.duration - fadeDuration}:d=${fadeDuration}`;
        }
        command += `[a${i + 1}];`;
    }
    for(let i = 0; i < effects.length; i++){
        command += `[a${i+1}]`;
    }
    let tempVideoPath = videoPath.replace('.mp4', '_temp.mp4');
    command += `amix=inputs=${effects.length}:duration=longest[mixed_audio];
        [0:a][mixed_audio]amix=inputs=2:duration=longest[audio_out]" -map 0:v -map "[audio_out]" -c:a ${audioStandard.codec} -c:v copy ${tempVideoPath}`;
    await task.runCommand(command);
    await fsPromises.unlink(videoPath);
    await fsPromises.rename(tempVideoPath, videoPath);
}

function estimateChapterVideoLength(spaceId, chapter) {
    let totalDuration = 0;
    for (let paragraph of chapter.paragraphs) {
        if (paragraph.commands.video) {
            let videoDuration = paragraph.commands.video.end - paragraph.commands.video.start;
            if(paragraph.commands.audio){
                //has both audio and video
                let maxDuration = Math.max(paragraph.commands.audio.duration, videoDuration);
                totalDuration += maxDuration;
            } else {
                totalDuration += parseFloat(videoDuration);
            }
        } else if (paragraph.commands.audio) {
            totalDuration += parseFloat(paragraph.commands.audio.duration);
        } else if (paragraph.commands["silence"]) {
            if (paragraph.commands["silence"].duration) {
                totalDuration += parseFloat(paragraph.commands["silence"].duration);
            }
        } else if (paragraph.commands.image) {
            totalDuration += 1;
        }
    }
    return totalDuration;
}
async function getAudioDurationFromBuffer(audioBuffer) {
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
    for (let chapter of document.chapters) {
        totalDuration += estimateChapterVideoLength(spaceId, chapter);
    }
    return totalDuration;
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
function createVideoThumbnail(filePath) {
    return new Promise((resolve, reject) => {
        const ffmpegProcess = spawn(ffmpegPath, [
            '-i', filePath,     // Input video file
            '-ss', '00:00:00',  // Seek to second 0
            '-vframes', '1',    // Capture 1 frame
            '-q:v', '2',        // Set quality of the image
            '-f', 'image2pipe', // Output as an image stream
            '-vcodec', 'png',   // Use PNG format
            'pipe:1'            // Output to stdout
        ]);

        const chunks = [];

        ffmpegProcess.stdout.on('data', (chunk) => {
            chunks.push(chunk);
        });

        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            } else {
                reject(new Error(`FFmpeg process exited with code ${code}`));
            }
        });

        ffmpegProcess.on('error', (err) => {
            reject(err);
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
    verifyMediaFileIntegrity,
    verifyAudioSettings,
    convertVideoToStandard,
    getAudioDurationFromBuffer,
    getImageDimensions,
    getVideoDuration,
    createVideoThumbnail,
    createVideoFromAudioAndImage,
    verifyVideoSettings,
    trimFileAdjustVolume,
    addEffectsToVideo,
    adjustVideoVolume,
    adjustAudioVolume
}
