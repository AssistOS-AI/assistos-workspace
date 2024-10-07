const path = require("path");
const fsPromises = require("fs/promises");
const volumeManager = require('../volumeManager.js');
const fs = require("fs");
const https = require("https");

const fileTypes = Object.freeze({
        audios: {
            contentType: "audio/mp3",
            extension: "mp3"
        },
        images: {
            contentType: "image/png",
            extension: "png"
        },
        videos: {
            contentType: "video/mp4",
            extension: "mp4"
        }
    }
)


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

async function insertVideo(spaceId, videoId, videoData, req) {
    return new Promise((resolve, reject) => {
        const storagePath = path.join(getSpacePath(spaceId), "videos");
        const filePath = path.join(storagePath, `${videoId}.mp4`);
        const fileStream = fs.createWriteStream(filePath);
        req.pipe(fileStream);
        fileStream.on('finish', () => {
            resolve(videoId);
        });
        fileStream.on('error', (err) => {
            reject(err);
        });
    });
}


async function getFile(spaceId, fileType, fileId, range) {
    async function getFileRange(filePath, range, defaultChunkSize = 1024 * 1024 * 3) {
        const stat = await fs.promises.stat(filePath);
        const fileSize = stat.size;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : start + defaultChunkSize;
            const validEnd = Math.min(end, fileSize - 1);
            return {start, end: validEnd, fileSize};
        }

        return {start: 0, end: fileSize - 1, fileSize};
    }

    if (!fileTypes[fileType]) {
        throw new Error(`Invalid file type: ${fileType}`);
    }
    const filePath = path.join(getSpacePath(spaceId), fileType, `${fileId}.${fileTypes[fileType].extension}`);
    const {start, end, fileSize} = await getFileRange(filePath, range);

    const fileStream = fs.createReadStream(filePath, {start, end});
    const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': (end - start) + 1,
        'Content-Type': fileTypes[fileType].contentType,
    };
    return {fileStream, head};
}


async function getVideo(spaceId, videoId, range) {
    return await getFile(spaceId, 'videos', videoId, range);
}

async function getImage(spaceId, imageId, range) {
    return await getFile(spaceId, 'images', imageId, range);
}

async function getAudio(spaceId, audioId, range) {
    return await getFile(spaceId, 'audios', audioId, range);
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

async function getDownloadURL(spaceId, downloadType, fileId) {
    const baseURL = volumeManager.getBaseURL();
    return `${baseURL}/spaces/${downloadType}/${spaceId}/${fileId}`;
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
    headAudio,
    headVideo,
    headImage,
    downloadData,
    getUploadURL,
    getDownloadURL,
}
