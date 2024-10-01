const path = require("path");
const fsPromises = require("fs/promises");
const volumeManager = require('../volumeManager.js');
const fs = require("fs");
const https = require("https");

function getSpacePath(spaceId) {
    return path.join(volumeManager.paths.space, spaceId);
}

async function downloadData(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest);
            reject(err);
        });
    });
}

async function insertImage(spaceId, imageId, imageData) {
    const storagePath = path.join(getSpacePath(spaceId), "images");
    if (Buffer.isBuffer(imageData)) {
        return await fsPromises.writeFile(path.join(storagePath, `${imageId}.png`), imageData);
    }
    if (imageData.startsWith("http")) {
        await downloadData(imageData, path.join(storagePath, `${imageId}.png`));
        return;
    }
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    await fsPromises.writeFile(path.join(storagePath, `${imageId}.png`), buffer);
}

async function insertAudio(spaceId, audioId, audioData) {
    const storagePath = path.join(getSpacePath(spaceId), "audios");
    let buffer;
    if (typeof audioData === 'string') {
        if (audioData.startsWith("data:")) {
            const base64Data = audioData.split(",")[1];
            buffer = Buffer.from(base64Data, 'base64');
            return await fsPromises.writeFile(path.join(storagePath, `${audioId}.mp3`), buffer);
        } else if (audioData.startsWith("http")) {
            await downloadData(audioData, path.join(storagePath, `${audioId}.mp3`));
            return;
        } else {
            buffer = Buffer.from(audioData, 'base64');
            return await fsPromises.writeFile(path.join(storagePath, `${audioId}.mp3`), buffer);
        }
    }
    buffer = Buffer.from(audioData);
    await fsPromises.writeFile(path.join(storagePath, `${audioId}.mp3`), buffer);
}

async function insertVideo(spaceId, videoId, dataSource) {
    const storagePath = path.join(getSpacePath(spaceId), "videos");
    if (typeof dataSource === 'string') {
        if (dataSource.startsWith("data:")) {
            const base64Data = dataSource.split(",")[1];
            let buffer = Buffer.from(base64Data, 'base64');
            await fsPromises.writeFile(path.join(storagePath, `${videoId}.mp4`), buffer);
        } else if (dataSource.startsWith("http")) {
            await downloadData(dataSource, path.join(storagePath, `${videoId}.mp4`));
            return;
        } else {
            const buffer = Buffer.from(dataSource, 'base64');
            await fsPromises.writeFile(path.join(storagePath, `${videoId}.mp4`), buffer);
        }
    } else {
        const buffer = Buffer.from(dataSource);
        await fsPromises.writeFile(path.join(storagePath, `${videoId}.mp4`), buffer);
    }
    return videoId;
}

async function getImage(spaceId, imageId) {
    const imagesPath = path.join(getSpacePath(spaceId), 'images');
    const imagePath = path.join(imagesPath, `${imageId}.png`);
    return await fsPromises.readFile(imagePath)
}

async function getAudio(spaceId, audioId) {
    const audiosPath = path.join(getSpacePath(spaceId), 'audios');
    const audioPath = path.join(audiosPath, `${audioId}.mp3`);
    return await fsPromises.readFile(audioPath);
}

async function getVideo(spaceId, videoId) {
    const videosPath = path.join(getSpacePath(spaceId), 'videos');
    const videoPath = path.join(videosPath, `${videoId}.mp4`);
    return await fsPromises.readFile(videoPath);
}

async function getVideoRange(spaceId, videoId, range) {
    const videosPath = path.join(getSpacePath(spaceId), 'videos');
    const videoPath = path.join(videosPath, `${videoId}.mp4`);
    const stat = await fs.promises.stat(videoPath);
    const fileSize = stat.size;
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const defaultChunkSize = 1024 * 1024 * 3; // 3MB
    const end = parts[1] ? parseInt(parts[1], 10) : start + defaultChunkSize;
    const validEnd = Math.min(end, fileSize - 1);

    const chunkSize = (validEnd - start) + 1;

    const fileStream = fs.createReadStream(videoPath, {start, end: validEnd});
    const head = {
        'Content-Range': `bytes ${start}-${validEnd}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
    };
    return {fileStream, head};
}

function getImageStream(spaceId, imageId) {
    const imagesPath = path.join(getSpacePath(spaceId), 'images');
    const imagePath = path.join(imagesPath, `${imageId}.png`);
    return fs.createReadStream(imagePath);
}

function getAudioStream(spaceId, audioId) {
    const audiosPath = path.join(getSpacePath(spaceId), 'audios');
    const audioPath = path.join(audiosPath, `${audioId}.mp3`);
    return fs.createReadStream(audioPath);
}

function getVideoStream(spaceId, videoId) {
    const videosPath = path.join(getSpacePath(spaceId), 'videos');
    const videoPath = path.join(videosPath, `${videoId}.mp4`);
    return fs.createReadStream(videoPath);
}

async function deleteImage(spaceId, imageId) {
    const imagesPath = path.join(getSpacePath(spaceId), 'images');
    const imagePath = path.join(imagesPath, `${imageId}.png`);
    await fsPromises.rm(imagePath);
}

async function deleteAudio(spaceId, audioId) {
    const audiosPath = path.join(getSpacePath(spaceId), 'audios');
    const audioPath = path.join(audiosPath, `${audioId}.mp3`);
    await fsPromises.rm(audioPath);
}

async function deleteVideo(spaceId, videoId) {
    const videosPath = path.join(getSpacePath(spaceId), 'videos');
    const videoPath = path.join(videosPath, `${videoId}.mp4`);
    await fsPromises.rm(videoPath);
}

/* TODO use ffmpeg */
async function headImage(spaceId, imageId) {
    const imagesPath = path.join(getSpacePath(spaceId), 'images');
    const imagePath = path.join(imagesPath, `${imageId}.png`);
    return await fsPromises.stat(imagePath);
}

async function headAudio(spaceId, audioId) {
    const audiosPath = path.join(getSpacePath(spaceId), 'audios');
    const audioPath = path.join(audiosPath, `${audioId}.mp3`);
    return await fsPromises.stat(audioPath);
}

async function headVideo(spaceId, videoId) {
    const videosPath = path.join(getSpacePath(spaceId), 'videos');
    const videoPath = path.join(videosPath, `${videoId}.mp4`);
    return await fsPromises.stat(videoPath);
}

async function getUploadURL(spaceId, uploadType, fileId) {
    const baseURL = volumeManager.getBaseURL();
    return `${baseURL}/spaces/${uploadType}/${spaceId}/${fileId}`;
}

module.exports = {
    insertImage,
    insertAudio,
    insertVideo,
    deleteImage,
    deleteAudio,
    deleteVideo,
    getImage,
    getAudio,
    getVideo,
    getImageStream,
    getAudioStream,
    getVideoStream,
    headAudio,
    headVideo,
    headImage,
    downloadData,
    getUploadURL,
    getVideoRange
}
